import { describe, expect, it } from 'vitest';
import { frameToPixels, hitBox } from './layers.ts';

describe('frameToPixels', () => {
	it('maps the frame centre to the middle of the frame box', () => {
		const frame = { left: 16, top: 16, size: 480 };

		const point = frameToPixels(frame, { x: 0, y: 0 });

		expect(point).toEqual({ x: 256, y: 256 });
	});
});

describe('hitBox', () => {
	const box = { cx: 100, cy: 100, width: 80, height: 20, rotation: 0 };

	it('hits a point inside an unrotated box', () => {
		expect(hitBox(box, { x: 130, y: 105 })).toBe(true);
	});

	it('misses a point outside the box height', () => {
		expect(hitBox(box, { x: 100, y: 125 })).toBe(false);
	});

	it('follows the box rotation', () => {
		const rotated = { ...box, rotation: Math.PI / 2 };

		expect(hitBox(rotated, { x: 100, y: 135 })).toBe(true);
		expect(hitBox(rotated, { x: 135, y: 100 })).toBe(false);
	});
});
