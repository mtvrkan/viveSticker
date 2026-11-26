import { describe, expect, it } from 'vitest';
import { blurAlpha } from './alpha.ts';

function pixels(alpha: number[]): Uint8ClampedArray {
	const data = new Uint8ClampedArray(alpha.length * 4);
	alpha.forEach((value, i) => {
		data[i * 4] = 10;
		data[i * 4 + 3] = value;
	});
	return data;
}

describe('blurAlpha', () => {
	it('softens a hard edge and leaves colour alone', () => {
		const data = pixels([0, 0, 255, 255, 0, 0]);
		blurAlpha(data, 6, 1, 1);
		expect(data[3]).toBe(0);
		expect(data[7]).toBe(85);
		expect(data[11]).toBe(170);
		expect(data[0]).toBe(10);
	});

	it('keeps uniform areas unchanged', () => {
		const data = pixels(Array(9).fill(255));
		blurAlpha(data, 3, 3, 2);
		expect([...data].filter((_, i) => i % 4 === 3).every((v) => v === 255)).toBe(true);
	});

	it('does nothing for a zero radius', () => {
		const data = pixels([0, 255]);
		blurAlpha(data, 2, 1, 0);
		expect(data[7]).toBe(255);
	});
});
