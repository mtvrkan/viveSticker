import { describe, expect, it } from 'vitest';
import { containTransform } from './doc.ts';
import {
	finishLasso,
	fitPoints,
	keyTransform,
	normalizeAngle,
	pinch,
	simplify,
	snap,
	toFrame,
	toImage,
	zoomAt
} from './geometry.ts';

const near = (value: number, expected: number) => expect(value).toBeCloseTo(expected, 6);

describe('transform mapping', () => {
	it('round-trips frame and image coordinates', () => {
		const t = { x: 0.1, y: -0.2, scale: 1.7, rotation: 0.6 };
		const p = { x: 0.23, y: -0.31 };
		const back = toImage(toFrame(p, t), t);
		near(back.x, p.x);
		near(back.y, p.y);
	});

	it('keeps the focus point fixed while zooming', () => {
		const t = { x: 0.05, y: 0.02, scale: 1, rotation: 0.3 };
		const focus = { x: 0.2, y: -0.1 };
		const before = toImage(focus, t);
		const after = toImage(focus, zoomAt(t, 2.5, focus));
		near(after.x, before.x);
		near(after.y, before.y);
	});

	it('pinch scales, rotates and follows the midpoint', () => {
		const t = containTransform();
		const result = pinch(
			t,
			[
				{ x: -0.1, y: 0 },
				{ x: 0.1, y: 0 }
			],
			[
				{ x: 0, y: -0.2 },
				{ x: 0, y: 0.2 }
			]
		);
		near(result.scale, 2);
		near(result.rotation, Math.PI / 2);
		near(result.x, 0);
		near(result.y, 0);
	});

	it('ignores a degenerate pinch', () => {
		const t = containTransform();
		expect(
			pinch(
				t,
				[
					{ x: 0, y: 0 },
					{ x: 0, y: 0 }
				],
				[
					{ x: 0, y: 0 },
					{ x: 1, y: 0 }
				]
			)
		).toBe(t);
	});

	it('clamps zoom to the allowed range', () => {
		expect(zoomAt(containTransform(), 1000, { x: 0, y: 0 }).scale).toBe(20);
		expect(zoomAt(containTransform(), 0.0001, { x: 0, y: 0 }).scale).toBe(0.1);
	});

	it('normalizes angles into (-π, π]', () => {
		near(normalizeAngle(Math.PI * 3), Math.PI);
		near(normalizeAngle(-Math.PI * 1.5), Math.PI / 2);
	});
});

describe('snap', () => {
	it('snaps near the center and to 45° steps', () => {
		const result = snap({ x: 0.01, y: -0.015, scale: 1, rotation: Math.PI / 4 + 0.03 });
		expect(result.snapX && result.snapY && result.snapAngle).toBe(true);
		expect(result.transform.x).toBe(0);
		near(result.transform.rotation, Math.PI / 4);
	});

	it('leaves distant values alone', () => {
		const t = { x: 0.2, y: 0.3, scale: 1, rotation: 0.4 };
		const result = snap(t);
		expect(result.snapX || result.snapY || result.snapAngle).toBe(false);
		expect(result.transform).toEqual(t);
	});
});

describe('lasso', () => {
	it('drops collinear points', () => {
		const line = Array.from({ length: 11 }, (_, i) => ({ x: i / 10, y: 0 }));
		expect(simplify(line, 0.001)).toEqual([line[0], line[10]]);
	});

	it('closes a usable path and rejects a tiny one', () => {
		const circle = Array.from({ length: 60 }, (_, i) => ({
			x: Math.cos((i / 60) * Math.PI * 2) * 0.3,
			y: Math.sin((i / 60) * Math.PI * 2) * 0.3
		}));
		expect(finishLasso(circle, 0.002)?.length).toBeGreaterThan(10);
		expect(
			finishLasso(
				circle.map((p) => ({ x: p.x / 100, y: p.y / 100 })),
				0.00001
			)
		).toBeNull();
		expect(finishLasso(circle.slice(0, 2), 0.002)).toBeNull();
	});

	it('fits the cut bounds to the frame', () => {
		const fitted = fitPoints(
			[
				{ x: 0.1, y: 0.1 },
				{ x: 0.3, y: 0.2 }
			],
			0
		);
		near(fitted!.scale, 5);
		near(fitted!.x, -1);
		near(fitted!.y, -0.75);
		expect(fitPoints([], 0)).toBeNull();
	});
});

describe('keyboard', () => {
	it('maps keys to transforms', () => {
		const t = containTransform();
		near(keyTransform('ArrowRight', false, t)!.x, 0.01);
		near(keyTransform('ArrowUp', true, t)!.y, -0.05);
		near(keyTransform(']', true, t)!.rotation, Math.PI / 12);
		expect(keyTransform('a', false, t)).toBeNull();
	});
});
