import encode from '@jsquash/webp/encode';
import type { EncodeRequest, EncodeResponse } from './encoder-protocol.ts';
import { findBestEncoding, type EncodeAttempt } from './quality.ts';

const scope = self as unknown as {
	onmessage: ((event: MessageEvent<EncodeRequest>) => void) | null;
	postMessage: (message: EncodeResponse, transfer?: Transferable[]) => void;
};

class Superseded extends Error {}

let latest = 0;

function yieldToMessages(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

async function encodeAttempt(id: number, pixels: ImageData, attempt: EncodeAttempt) {
	await yieldToMessages();
	if (id !== latest) throw new Superseded();
	const buffer = await encode(pixels, {
		lossless: attempt.lossless ? 1 : 0,
		quality: attempt.lossless ? 75 : attempt.quality,
		method: 4,
		use_sharp_yuv: 1,
		alpha_quality: 100,
		exact: 0
	});
	return { buffer, size: buffer.byteLength };
}

async function handle(request: EncodeRequest): Promise<EncodeResponse> {
	if (request.kind === 'frame') {
		const buffer = await encode(request.pixels, {
			quality: request.quality,
			method: 4,
			use_sharp_yuv: 1,
			alpha_quality: 90,
			exact: 0
		});
		return { id: request.id, status: 'done', buffer, lossless: false, quality: request.quality, fits: true };
	}
	const { id, pixels, quality, limit } = request;
	if (quality.mode === 'manual') {
		const { buffer, size } = await encodeAttempt(id, pixels, { lossless: false, quality: quality.quality });
		return { id, status: 'done', buffer, lossless: false, quality: quality.quality, fits: size <= limit };
	}
	const outcome = await findBestEncoding((attempt) => encodeAttempt(id, pixels, attempt), limit);
	return {
		id,
		status: 'done',
		buffer: outcome.result.buffer,
		lossless: outcome.attempt.lossless,
		quality: outcome.attempt.quality,
		fits: outcome.fits
	};
}

scope.onmessage = (event) => {
	const request = event.data;
	if (request.kind === 'still') latest = request.id;
	handle(request).then(
		(response) => scope.postMessage(response, response.status === 'done' ? [response.buffer] : []),
		(error: unknown) =>
			scope.postMessage({ id: request.id, status: error instanceof Superseded ? 'skipped' : 'failed' })
	);
};
