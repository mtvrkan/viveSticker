import type { QualityMode } from './doc.ts';
import type { EncodeRequest, EncodeResponse } from './encoder-protocol.ts';

export type EncodeResult = { blob: Blob; size: number; lossless: boolean; quality: number; fits: boolean };

export class EncoderFailure extends Error {}

type Pending = (response: EncodeResponse) => void;
type RequestBody = EncodeRequest extends infer T ? (T extends unknown ? Omit<T, 'id'> : never) : never;

class EncoderChannel {
	private readonly worker: Worker;
	private readonly pending = new Map<number, Pending>();
	private nextId = 0;

	constructor() {
		this.worker = new Worker(new URL('./encoder.worker.ts', import.meta.url), { type: 'module' });
		this.worker.onmessage = (event: MessageEvent<EncodeResponse>) => {
			const resolve = this.pending.get(event.data.id);
			this.pending.delete(event.data.id);
			resolve?.(event.data);
		};
		this.worker.onerror = () => this.settleAll('failed');
	}

	get load(): number {
		return this.pending.size;
	}

	send(request: RequestBody): Promise<EncodeResponse> {
		const id = ++this.nextId;
		return new Promise((resolve) => {
			this.pending.set(id, resolve);
			this.worker.postMessage({ ...request, id } as EncodeRequest, [request.pixels.data.buffer]);
		});
	}

	dispose(): void {
		this.worker.terminate();
		this.settleAll('skipped');
	}

	private settleAll(status: 'failed' | 'skipped') {
		for (const [id, resolve] of this.pending) resolve({ id, status });
		this.pending.clear();
	}
}

export class StickerEncoder {
	private readonly channel = new EncoderChannel();

	async encode(pixels: ImageData, quality: QualityMode, limit: number): Promise<EncodeResult | null> {
		const response = await this.channel.send({ kind: 'still', pixels, quality, limit });
		if (response.status === 'skipped') return null;
		if (response.status === 'failed') throw new EncoderFailure();
		return {
			blob: new Blob([response.buffer], { type: 'image/webp' }),
			size: response.buffer.byteLength,
			lossless: response.lossless,
			quality: response.quality,
			fits: response.fits
		};
	}

	dispose(): void {
		this.channel.dispose();
	}
}

export class FrameEncoderPool {
	private readonly channels: EncoderChannel[];

	constructor(size = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1))) {
		this.channels = Array.from({ length: size }, () => new EncoderChannel());
	}

	get size(): number {
		return this.channels.length;
	}

	async encodeFrame(pixels: ImageData, quality: number): Promise<Uint8Array> {
		const channel = this.channels.reduce((best, item) => (item.load < best.load ? item : best));
		const response = await channel.send({ kind: 'frame', pixels, quality });
		if (response.status !== 'done') throw new EncoderFailure();
		return new Uint8Array(response.buffer);
	}

	dispose(): void {
		for (const channel of this.channels) channel.dispose();
	}
}
