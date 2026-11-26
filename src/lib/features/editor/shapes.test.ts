import { describe, expect, it } from 'vitest';
import { containTransform } from './doc.ts';
import { aspectBox, shapeOps, type PathOp } from './shapes.ts';
import { opsToSvg } from './icon-path.ts';

const frame = { left: 16, top: 16, size: 480 };

function bounds(ops: PathOp[]) {
	const xs: number[] = [];
	const ys: number[] = [];
	for (const op of ops)
		for (let i = 1; i + 1 < op.length; i += 2) {
			xs.push(op[i] as number);
			ys.push(op[i + 1] as number);
		}
	return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

describe('shapes', () => {
	it('fits aspect boxes inside the frame', () => {
		expect(aspectBox(16 / 9, frame)).toEqual({ x0: 16, y0: 16 + 105, x1: 496, y1: 16 + 375 });
		expect(aspectBox(1, frame)).toEqual({ x0: 16, y0: 16, x1: 496, y1: 496 });
	});

	it('builds a closed square without rounding', () => {
		const ops = shapeOps({ kind: 'rect', aspect: '1:1', corner: 0 }, frame, containTransform());
		expect(ops).toHaveLength(5);
		expect(ops.at(-1)).toEqual(['Z']);
	});

	it('keeps every preset inside the frame', () => {
		for (const preset of ['heart', 'star', 'bubble'] as const) {
			const box = bounds(shapeOps({ kind: 'preset', preset }, frame, containTransform()));
			expect(box.x0).toBeGreaterThanOrEqual(frame.left - 10);
			expect(box.x1).toBeLessThanOrEqual(frame.left + frame.size + 10);
			expect(box.y0).toBeGreaterThanOrEqual(frame.top);
			expect(box.y1).toBeLessThanOrEqual(frame.top + frame.size);
		}
	});

	it('maps lasso points through the image transform', () => {
		const ops = shapeOps(
			{
				kind: 'lasso',
				points: [
					{ x: 0, y: 0 },
					{ x: 0.25, y: 0 },
					{ x: 0, y: 0.25 }
				]
			},
			frame,
			{ x: 0, y: 0, scale: 2, rotation: 0 }
		);
		expect(ops[0]).toEqual(['M', 256, 256]);
		expect(ops[1]).toEqual(['L', 496, 256]);
		expect(shapeOps({ kind: 'lasso', points: [] }, frame, containTransform())).toEqual([]);
	});

	it('serialises paths for icons', () => {
		expect(opsToSvg([['M', 1, 2], ['L', 3.456, 4], ['Z']])).toBe('M1 2L3.46 4Z');
	});
});
