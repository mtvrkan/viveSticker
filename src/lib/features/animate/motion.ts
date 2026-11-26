import type { SourceMedia } from '#lib/core/types.ts';
import { MAX_FPS, nativeFps } from './plan.ts';
import { DecodeError } from './decode/errors.ts';
import { splitApng } from './decode/apng.ts';
import { splitAnimatedWebp } from './decode/webp-anim.ts';
import type { DecodeRequest, DecodeResponse } from './decode-protocol.ts';

export type MotionFrame = { image: CanvasImageSource; width: number; height: number };

type TimedFrame = { image: ImageBitmap; startMs: number; durationMs: number };

const SEEK_TIMEOUT_MS = 8000;
const FRAME_SETTLE_MS = 60;
const MAX_FRAME_PIXELS = 50_000_000;

export class MotionFailure extends Error {
	constructor(readonly reason: 'too-large' | 'decode-failed') {
		super(reason);
	}
}

export interface MotionSource {
	readonly kind: 'video' | 'frames';
	readonly width: number;
	readonly height: number;
	readonly durationMs: number;
	readonly fps: number;
	frameAt(ms: number): Promise<MotionFrame>;
	dispose(): void;
}

export class FramesMotion implements MotionSource {
	readonly kind = 'frames';
	readonly durationMs: number;
	readonly fps: number;

	constructor(
		readonly width: number,
		readonly height: number,
		private readonly frames: TimedFrame[]
	) {
		const last = frames.at(-1);
		this.durationMs = last ? last.startMs + last.durationMs : 0;
		this.fps = nativeFps(frames.map((frame) => frame.durationMs));
	}

	frameSync(ms: number): MotionFrame {
		let low = 0;
		let high = this.frames.length - 1;
		while (low < high) {
			const middle = Math.ceil((low + high) / 2);
			if ((this.frames[middle] as TimedFrame).startMs <= ms) low = middle;
			else high = middle - 1;
		}
		const frame = this.frames[low] as TimedFrame;
		return { image: frame.image, width: this.width, height: this.height };
	}

	frameIndex(ms: number): number {
		return this.frames.findLastIndex((frame) => frame.startMs <= ms);
	}

	async frameAt(ms: number): Promise<MotionFrame> {
		return this.frameSync(ms);
	}

	dispose(): void {
		for (const frame of this.frames) frame.image.close();
	}
}

function waitFor(target: EventTarget, event: string, timeoutMs = SEEK_TIMEOUT_MS): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			target.removeEventListener(event, done);
			reject(new MotionFailure('decode-failed'));
		}, timeoutMs);
		function done() {
			clearTimeout(timer);
			resolve();
		}
		target.addEventListener(event, done, { once: true });
	});
}

function settleFrame(video: HTMLVideoElement): Promise<void> {
	return new Promise((resolve) => {
		const timer = setTimeout(resolve, FRAME_SETTLE_MS);
		if ('requestVideoFrameCallback' in video)
			video.requestVideoFrameCallback(() => {
				clearTimeout(timer);
				resolve();
			});
	});
}

export function createVideoElement(url: string): HTMLVideoElement {
	const video = document.createElement('video');
	video.muted = true;
	video.defaultMuted = true;
	video.playsInline = true;
	video.preload = 'auto';
	video.crossOrigin = 'anonymous';
	video.setAttribute('playsinline', '');
	video.setAttribute('aria-hidden', 'true');
	video.src = url;
	return video;
}

export async function prepareVideo(video: HTMLVideoElement): Promise<void> {
	if (video.readyState < 2) {
		const ready = waitFor(video, 'loadeddata');
		video.load();
		await ready;
	}
}

export async function seekVideo(video: HTMLVideoElement, ms: number): Promise<void> {
	const target = Math.max(0, Math.min(ms / 1000, (video.duration || 0) - 0.001));
	if (Math.abs(video.currentTime - target) < 0.0005 && video.readyState >= 2) return;
	const seeked = waitFor(video, 'seeked');
	video.currentTime = target;
	await seeked;
	await settleFrame(video);
}

export class VideoMotion implements MotionSource {
	readonly kind = 'video';
	readonly fps = MAX_FPS;
	private exporter: HTMLVideoElement | null = null;

	constructor(
		readonly url: string,
		readonly width: number,
		readonly height: number,
		readonly durationMs: number
	) {}

	async frameAt(ms: number): Promise<MotionFrame> {
		if (!this.exporter) {
			this.exporter = createVideoElement(this.url);
			await prepareVideo(this.exporter);
		}
		await seekVideo(this.exporter, ms);
		return { image: this.exporter, width: this.width, height: this.height };
	}

	dispose(): void {
		if (!this.exporter) return;
		this.exporter.removeAttribute('src');
		this.exporter.load();
		this.exporter = null;
	}
}

type ComposeFrame = {
	blob: Blob;
	x: number;
	y: number;
	width: number;
	height: number;
	delayMs: number;
	blend: boolean;
	dispose: 'none' | 'background' | 'previous';
};

async function compose(width: number, height: number, frames: ComposeFrame[]): Promise<TimedFrame[]> {
	if (width * height * frames.length > MAX_FRAME_PIXELS) throw new MotionFailure('too-large');
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new MotionFailure('decode-failed');
	const output: TimedFrame[] = [];
	let time = 0;
	for (const frame of frames) {
		const bitmap = await createImageBitmap(frame.blob);
		const saved =
			frame.dispose === 'previous' ? ctx.getImageData(frame.x, frame.y, frame.width, frame.height) : null;
		if (!frame.blend) ctx.clearRect(frame.x, frame.y, frame.width, frame.height);
		ctx.drawImage(bitmap, frame.x, frame.y);
		bitmap.close();
		output.push({ image: await createImageBitmap(canvas), startMs: time, durationMs: frame.delayMs });
		time += frame.delayMs;
		if (frame.dispose === 'background') ctx.clearRect(frame.x, frame.y, frame.width, frame.height);
		if (saved) ctx.putImageData(saved, frame.x, frame.y);
	}
	return output;
}

function decodeGifInWorker(
	bytes: Uint8Array
): Promise<{ width: number; height: number; frames: TimedFrame[] }> {
	return new Promise((resolve, reject) => {
		const worker = new Worker(new URL('./decode.worker.ts', import.meta.url), { type: 'module' });
		worker.onmessage = async (event: MessageEvent<DecodeResponse>) => {
			worker.terminate();
			const data = event.data;
			if (data.status === 'failed') {
				reject(new MotionFailure(data.reason === 'too-large' ? 'too-large' : 'decode-failed'));
				return;
			}
			try {
				let time = 0;
				const frames: TimedFrame[] = [];
				for (const frame of data.frames) {
					const image = await createImageBitmap(
						new ImageData(new Uint8ClampedArray(frame.rgba), data.width, data.height)
					);
					frames.push({ image, startMs: time, durationMs: frame.delayMs });
					time += frame.delayMs;
				}
				resolve({ width: data.width, height: data.height, frames });
			} catch {
				reject(new MotionFailure('decode-failed'));
			}
		};
		worker.onerror = () => {
			worker.terminate();
			reject(new MotionFailure('decode-failed'));
		};
		const request: DecodeRequest = { bytes, maxPixels: MAX_FRAME_PIXELS };
		worker.postMessage(request, [bytes.buffer]);
	});
}

function toBlob(bytes: Uint8Array, type: string): Blob {
	return new Blob([bytes.slice().buffer], { type });
}

async function openFrames(media: SourceMedia): Promise<FramesMotion> {
	const bytes = new Uint8Array(await media.blob.arrayBuffer());
	try {
		if (media.mime === 'image/gif') {
			const gif = await decodeGifInWorker(bytes);
			return new FramesMotion(gif.width, gif.height, gif.frames);
		}
		if (media.mime === 'image/webp') {
			const split = splitAnimatedWebp(bytes);
			const frames = await compose(
				split.width,
				split.height,
				split.frames.map((frame) => ({
					blob: toBlob(frame.webp, 'image/webp'),
					x: frame.x,
					y: frame.y,
					width: frame.width,
					height: frame.height,
					delayMs: frame.durationMs,
					blend: frame.blend,
					dispose: frame.dispose ? 'background' : 'none'
				}))
			);
			return new FramesMotion(split.width, split.height, frames);
		}
		const split = splitApng(bytes);
		const frames = await compose(
			split.width,
			split.height,
			split.frames.map((frame, index) => ({
				blob: toBlob(frame.png, 'image/png'),
				x: frame.x,
				y: frame.y,
				width: frame.width,
				height: frame.height,
				delayMs: frame.delayMs,
				blend: frame.blend === 1,
				dispose:
					frame.dispose === 1 || (frame.dispose === 2 && index === 0)
						? 'background'
						: frame.dispose === 2
							? 'previous'
							: 'none'
			}))
		);
		return new FramesMotion(split.width, split.height, frames);
	} catch (error) {
		if (error instanceof MotionFailure) throw error;
		if (error instanceof DecodeError && error.reason === 'too-large') throw new MotionFailure('too-large');
		throw new MotionFailure('decode-failed');
	}
}

async function openVideo(media: SourceMedia): Promise<VideoMotion> {
	const probe = createVideoElement(media.objectUrl);
	try {
		await prepareVideo(probe);
		const durationMs = media.durationMs ?? Math.round(probe.duration * 1000);
		if (!probe.videoWidth || !Number.isFinite(durationMs)) throw new MotionFailure('decode-failed');
		return new VideoMotion(media.objectUrl, probe.videoWidth, probe.videoHeight, durationMs);
	} finally {
		probe.removeAttribute('src');
		probe.load();
	}
}

export function openMotion(media: SourceMedia): Promise<MotionSource> {
	return media.kind === 'video' ? openVideo(media) : openFrames(media);
}
