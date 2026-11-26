import { clampScale, type Point, type Transform } from './doc.ts';

export const CENTER_SNAP = 0.02;
export const ANGLE_SNAP = (4 * Math.PI) / 180;
export const ANGLE_STEP = Math.PI / 4;
export const LASSO_MIN_AREA = 0.0004;

function rotate(p: Point, angle: number): Point {
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos };
}

export function normalizeAngle(angle: number): number {
	const full = Math.PI * 2;
	let value = angle % full;
	if (value <= -Math.PI) value += full;
	if (value > Math.PI) value -= full;
	return value;
}

export function toFrame(p: Point, t: Transform): Point {
	const r = rotate({ x: p.x * t.scale, y: p.y * t.scale }, t.rotation);
	return { x: r.x + t.x, y: r.y + t.y };
}

export function toImage(q: Point, t: Transform): Point {
	const r = rotate({ x: q.x - t.x, y: q.y - t.y }, -t.rotation);
	return { x: r.x / t.scale, y: r.y / t.scale };
}

export function pan(t: Transform, dx: number, dy: number): Transform {
	return { ...t, x: t.x + dx, y: t.y + dy };
}

export function pinch(t: Transform, from: [Point, Point], to: [Point, Point]): Transform {
	const [a0, b0] = from;
	const [a1, b1] = to;
	const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y);
	const d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y);
	if (d0 < 1e-6 || d1 < 1e-6) return t;
	const angle = Math.atan2(b1.y - a1.y, b1.x - a1.x) - Math.atan2(b0.y - a0.y, b0.x - a0.x);
	const m0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
	const m1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
	return pivot(t, d1 / d0, angle, m0, m1);
}

export function zoomAt(t: Transform, factor: number, focus: Point): Transform {
	return pivot(t, factor, 0, focus, focus);
}

export function rotateAround(t: Transform, angle: number, focus: Point = { x: 0, y: 0 }): Transform {
	return pivot(t, 1, angle, focus, focus);
}

function pivot(t: Transform, factor: number, angle: number, from: Point, to: Point): Transform {
	const scale = clampScale(t.scale * factor);
	const k = scale / t.scale;
	const offset = rotate({ x: (t.x - from.x) * k, y: (t.y - from.y) * k }, angle);
	return {
		x: to.x + offset.x,
		y: to.y + offset.y,
		scale,
		rotation: normalizeAngle(t.rotation + angle)
	};
}

export type SnapResult = { transform: Transform; snapX: boolean; snapY: boolean; snapAngle: boolean };

export function snap(t: Transform): SnapResult {
	const snapX = Math.abs(t.x) < CENTER_SNAP;
	const snapY = Math.abs(t.y) < CENTER_SNAP;
	const nearest = Math.round(t.rotation / ANGLE_STEP) * ANGLE_STEP;
	const snapAngle = Math.abs(t.rotation - nearest) < ANGLE_SNAP;
	return {
		transform: {
			x: snapX ? 0 : t.x,
			y: snapY ? 0 : t.y,
			scale: t.scale,
			rotation: snapAngle ? normalizeAngle(nearest) : t.rotation
		},
		snapX,
		snapY,
		snapAngle
	};
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const length = Math.hypot(dx, dy);
	if (length === 0) return Math.hypot(p.x - a.x, p.y - a.y);
	return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / length;
}

export function simplify(points: Point[], tolerance: number): Point[] {
	if (points.length < 3) return points.slice();
	const keep = new Uint8Array(points.length);
	keep[0] = 1;
	keep[points.length - 1] = 1;
	const stack: [number, number][] = [[0, points.length - 1]];
	while (stack.length > 0) {
		const [start, end] = stack.pop() as [number, number];
		let maxDistance = 0;
		let index = -1;
		for (let i = start + 1; i < end; i++) {
			const distance = perpendicularDistance(
				points[i] as Point,
				points[start] as Point,
				points[end] as Point
			);
			if (distance > maxDistance) {
				maxDistance = distance;
				index = i;
			}
		}
		if (index !== -1 && maxDistance > tolerance) {
			keep[index] = 1;
			stack.push([start, index], [index, end]);
		}
	}
	return points.filter((_, i) => keep[i] === 1);
}

export function smoothClosed(points: Point[], iterations: number): Point[] {
	let current = points;
	for (let step = 0; step < iterations && current.length >= 3; step++) {
		const next: Point[] = [];
		for (let i = 0; i < current.length; i++) {
			const a = current[i] as Point;
			const b = current[(i + 1) % current.length] as Point;
			next.push(
				{ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 },
				{ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 }
			);
		}
		current = next;
	}
	return current;
}

export function polygonArea(points: Point[]): number {
	let sum = 0;
	for (let i = 0; i < points.length; i++) {
		const a = points[i] as Point;
		const b = points[(i + 1) % points.length] as Point;
		sum += a.x * b.y - b.x * a.y;
	}
	return Math.abs(sum) / 2;
}

export function finishLasso(raw: Point[], tolerance: number): Point[] | null {
	if (raw.length < 3) return null;
	const simplified = simplify(raw, tolerance);
	if (simplified.length < 3) return null;
	const smooth = smoothClosed(simplified, 2);
	return polygonArea(smooth) >= LASSO_MIN_AREA ? smooth : null;
}

export function fitPoints(points: Point[], rotation: number): Transform | null {
	if (points.length === 0) return null;
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;
	for (const p of points) {
		const r = rotate(p, rotation);
		minX = Math.min(minX, r.x);
		minY = Math.min(minY, r.y);
		maxX = Math.max(maxX, r.x);
		maxY = Math.max(maxY, r.y);
	}
	const size = Math.max(maxX - minX, maxY - minY);
	if (size <= 0) return null;
	const scale = clampScale(1 / size);
	return {
		x: -((minX + maxX) / 2) * scale,
		y: -((minY + maxY) / 2) * scale,
		scale,
		rotation
	};
}

export const NUDGE_STEP = 0.01;
export const NUDGE_STEP_LARGE = 0.05;

export function keyTransform(key: string, large: boolean, t: Transform): Transform | null {
	const step = large ? NUDGE_STEP_LARGE : NUDGE_STEP;
	const angle = ((large ? 15 : 1) * Math.PI) / 180;
	const origin = { x: 0, y: 0 };
	switch (key) {
		case 'ArrowLeft':
			return pan(t, -step, 0);
		case 'ArrowRight':
			return pan(t, step, 0);
		case 'ArrowUp':
			return pan(t, 0, -step);
		case 'ArrowDown':
			return pan(t, 0, step);
		case '+':
		case '=':
			return zoomAt(t, 1.05, origin);
		case '-':
			return zoomAt(t, 1 / 1.05, origin);
		case '[':
			return rotateAround(t, -angle);
		case ']':
			return rotateAround(t, angle);
		default:
			return null;
	}
}
