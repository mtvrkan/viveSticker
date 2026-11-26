export type EncodeAttempt = { lossless: boolean; quality: number };

export type EncodeOutcome<T> = { attempt: EncodeAttempt; result: T; fits: boolean };

export const AUTO_QUALITY_MIN = 10;
export const AUTO_QUALITY_MAX = 95;

export async function findBestEncoding<T extends { size: number }>(
	encode: (attempt: EncodeAttempt) => Promise<T>,
	limit: number,
	min = AUTO_QUALITY_MIN,
	max = AUTO_QUALITY_MAX
): Promise<EncodeOutcome<T>> {
	const lossless = { lossless: true, quality: 100 };
	const losslessResult = await encode(lossless);
	if (losslessResult.size <= limit) return { attempt: lossless, result: losslessResult, fits: true };

	const tried = new Map<number, T>();
	async function tryQuality(quality: number): Promise<T> {
		const cached = tried.get(quality);
		if (cached) return cached;
		const result = await encode({ lossless: false, quality });
		tried.set(quality, result);
		return result;
	}

	let low = min;
	let high = max;
	let best: number | null = null;
	while (low <= high) {
		const middle = Math.floor((low + high) / 2);
		if ((await tryQuality(middle)).size <= limit) {
			best = middle;
			low = middle + 1;
		} else {
			high = middle - 1;
		}
	}
	const quality = best ?? min;
	return {
		attempt: { lossless: false, quality },
		result: await tryQuality(quality),
		fits: best !== null
	};
}
