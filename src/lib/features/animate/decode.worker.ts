import { DecodeError } from './decode/errors.ts';
import { decodeGif } from './decode/gif.ts';
import type { DecodeRequest, DecodeResponse } from './decode-protocol.ts';

const scope = self as unknown as {
	onmessage: ((event: MessageEvent<DecodeRequest>) => void) | null;
	postMessage: (message: DecodeResponse, transfer?: Transferable[]) => void;
};

scope.onmessage = (event) => {
	try {
		const gif = decodeGif(event.data.bytes, { maxPixels: event.data.maxPixels });
		const frames = gif.frames.map((frame) => ({
			rgba: frame.rgba.buffer as ArrayBuffer,
			delayMs: frame.delayMs
		}));
		scope.postMessage(
			{ status: 'done', width: gif.width, height: gif.height, frames },
			frames.map((frame) => frame.rgba)
		);
	} catch (error) {
		scope.postMessage({
			status: 'failed',
			reason: error instanceof DecodeError && error.reason === 'too-large' ? 'too-large' : 'invalid'
		});
	}
};
