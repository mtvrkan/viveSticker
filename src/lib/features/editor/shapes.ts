import { aspectValue, type PresetShape, type Shape, type Transform } from './doc.ts';
import { toFrame } from './geometry.ts';

export type PathOp =
	| ['M', number, number]
	| ['L', number, number]
	| ['C', number, number, number, number, number, number]
	| ['Z'];

export type Frame = { left: number; top: number; size: number };

const KAPPA = 0.5522847498;

type Box = { x0: number; y0: number; x1: number; y1: number };

function roundedBox(box: Box, radius: number): PathOp[] {
	const { x0, y0, x1, y1 } = box;
	const r = Math.max(0, Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2));
	if (r === 0) return [['M', x0, y0], ['L', x1, y0], ['L', x1, y1], ['L', x0, y1], ['Z']];
	const k = r * KAPPA;
	return [
		['M', x0 + r, y0],
		['L', x1 - r, y0],
		['C', x1 - r + k, y0, x1, y0 + r - k, x1, y0 + r],
		['L', x1, y1 - r],
		['C', x1, y1 - r + k, x1 - r + k, y1, x1 - r, y1],
		['L', x0 + r, y1],
		['C', x0 + r - k, y1, x0, y1 - r + k, x0, y1 - r],
		['L', x0, y0 + r],
		['C', x0, y0 + r - k, x0 + r - k, y0, x0 + r, y0],
		['Z']
	];
}

function ellipse(cx: number, cy: number, rx: number, ry: number): PathOp[] {
	const kx = rx * KAPPA;
	const ky = ry * KAPPA;
	return [
		['M', cx, cy - ry],
		['C', cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy],
		['C', cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry],
		['C', cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy],
		['C', cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry],
		['Z']
	];
}

function heartUnit(): PathOp[] {
	return [
		['M', 0.5, 0.94],
		['C', 0.14, 0.68, -0.02, 0.46, 0.04, 0.26],
		['C', 0.1, 0.06, 0.38, 0.02, 0.5, 0.22],
		['C', 0.62, 0.02, 0.9, 0.06, 0.96, 0.26],
		['C', 1.02, 0.46, 0.86, 0.68, 0.5, 0.94],
		['Z']
	];
}

function starUnit(): PathOp[] {
	const outer = 0.5;
	const inner = 0.21;
	const cx = 0.5;
	const cy = 0.548;
	const ops: PathOp[] = [];
	for (let i = 0; i < 10; i++) {
		const radius = i % 2 === 0 ? outer : inner;
		const angle = -Math.PI / 2 + (i * Math.PI) / 5;
		const x = cx + Math.cos(angle) * radius;
		const y = cy + Math.sin(angle) * radius;
		ops.push(i === 0 ? ['M', x, y] : ['L', x, y]);
	}
	ops.push(['Z']);
	return ops;
}

function bubbleUnit(): PathOp[] {
	const x0 = 0.02;
	const y0 = 0.06;
	const x1 = 0.98;
	const y1 = 0.76;
	const r = 0.16;
	const k = r * KAPPA;
	return [
		['M', x0 + r, y0],
		['L', x1 - r, y0],
		['C', x1 - r + k, y0, x1, y0 + r - k, x1, y0 + r],
		['L', x1, y1 - r],
		['C', x1, y1 - r + k, x1 - r + k, y1, x1 - r, y1],
		['L', 0.44, y1],
		['L', 0.2, 0.96],
		['L', 0.28, y1],
		['L', x0 + r, y1],
		['C', x0 + r - k, y1, x0, y1 - r + k, x0, y1 - r],
		['L', x0, y0 + r],
		['C', x0, y0 + r - k, x0 + r - k, y0, x0 + r, y0],
		['Z']
	];
}

const presetUnits: Record<PresetShape, () => PathOp[]> = {
	heart: heartUnit,
	star: starUnit,
	bubble: bubbleUnit
};

function mapOps(ops: PathOp[], map: (x: number, y: number) => [number, number]): PathOp[] {
	return ops.map((op): PathOp => {
		switch (op[0]) {
			case 'M':
				return ['M', ...map(op[1], op[2])];
			case 'L':
				return ['L', ...map(op[1], op[2])];
			case 'C':
				return ['C', ...map(op[1], op[2]), ...map(op[3], op[4]), ...map(op[5], op[6])];
			default:
				return op;
		}
	});
}

export function aspectBox(aspect: number, frame: Frame): Box {
	const width = aspect >= 1 ? frame.size : frame.size * aspect;
	const height = aspect >= 1 ? frame.size / aspect : frame.size;
	const x0 = frame.left + (frame.size - width) / 2;
	const y0 = frame.top + (frame.size - height) / 2;
	return { x0, y0, x1: x0 + width, y1: y0 + height };
}

export function shapeOps(shape: Shape, frame: Frame, transform: Transform): PathOp[] {
	switch (shape.kind) {
		case 'rect': {
			const box = aspectBox(aspectValue(shape.aspect), frame);
			const short = Math.min(box.x1 - box.x0, box.y1 - box.y0);
			return roundedBox(box, short * shape.corner);
		}
		case 'circle':
			return ellipse(frame.left + frame.size / 2, frame.top + frame.size / 2, frame.size / 2, frame.size / 2);
		case 'preset':
			return mapOps(presetUnits[shape.preset](), (x, y) => [
				frame.left + x * frame.size,
				frame.top + y * frame.size
			]);
		case 'lasso': {
			const ops: PathOp[] = shape.points.map((p, index) => {
				const q = toFrame(p, transform);
				const x = frame.left + (q.x + 0.5) * frame.size;
				const y = frame.top + (q.y + 0.5) * frame.size;
				return index === 0 ? ['M', x, y] : ['L', x, y];
			});
			if (ops.length > 0) ops.push(['Z']);
			return ops;
		}
	}
}

export function tracePath(target: CanvasPath, ops: PathOp[]): void {
	for (const op of ops) {
		switch (op[0]) {
			case 'M':
				target.moveTo(op[1], op[2]);
				break;
			case 'L':
				target.lineTo(op[1], op[2]);
				break;
			case 'C':
				target.bezierCurveTo(op[1], op[2], op[3], op[4], op[5], op[6]);
				break;
			case 'Z':
				target.closePath();
				break;
		}
	}
}
