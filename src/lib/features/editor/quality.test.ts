import { describe, expect, it } from 'vitest';
import { findBestEncoding, type EncodeAttempt } from './quality.ts';

function fakeEncoder(losslessSize: number, perQuality: number) {
	const calls: EncodeAttempt[] = [];
	const encode = async (attempt: EncodeAttempt) => {
		calls.push(attempt);
		return { size: attempt.lossless ? losslessSize : attempt.quality * perQuality };
	};
	return { encode, calls };
}

describe('findBestEncoding', () => {
	it('prefers lossless when it fits', async () => {
		const { encode, calls } = fakeEncoder(50, 10);
		const outcome = await findBestEncoding(encode, 100);
		expect(outcome.attempt.lossless).toBe(true);
		expect(calls).toHaveLength(1);
	});

	it('finds the highest lossy quality under the limit', async () => {
		const { encode } = fakeEncoder(200_000, 1000);
		const outcome = await findBestEncoding(encode, 72_500);
		expect(outcome).toMatchObject({ attempt: { lossless: false, quality: 72 }, fits: true });
		expect(outcome.result.size).toBe(72_000);
	});

	it('reports when even the lowest quality is too big', async () => {
		const { encode } = fakeEncoder(200_000, 1000);
		const outcome = await findBestEncoding(encode, 5_000);
		expect(outcome).toMatchObject({ attempt: { quality: 10 }, fits: false });
	});
});
