import type { ImportErrorReason, SourceMedia } from '#lib/core/types.ts';
import { INPUT_MAX_BYTES } from '#lib/core/whatsapp.ts';
import {
	familyOf,
	fileNameFromUrl,
	inspectAnimation,
	mayBeAnimated,
	parseHttpUrl,
	resolveMime,
	validateSize
} from './classify.ts';

const METADATA_TIMEOUT_MS = 15_000;
const ANIMATION_SCAN_MAX_BYTES = 60 * 1024 * 1024;

export class ImportFailure extends Error {
	constructor(readonly reason: ImportErrorReason) {
		super(reason);
	}
}

export async function loadMedia(blob: Blob, name: string): Promise<SourceMedia> {
	const sizeProblem = validateSize(blob.size, INPUT_MAX_BYTES);
	if (sizeProblem) throw new ImportFailure(sizeProblem);
	const mime = resolveMime(blob.type, name);
	if (!mime) throw new ImportFailure('unsupported-type');

	const objectUrl = URL.createObjectURL(blob);
	try {
		const base = { id: crypto.randomUUID(), blob, name, mime, bytes: blob.size, objectUrl };
		if (familyOf(mime) === 'video') {
			const video = await readVideoMetadata(objectUrl);
			return { ...base, kind: 'video', ...video, frameCount: null };
		}
		const size = await readImageSize(objectUrl);
		const animation =
			mayBeAnimated(mime) && blob.size <= ANIMATION_SCAN_MAX_BYTES
				? inspectAnimation(new Uint8Array(await blob.arrayBuffer()), mime)
				: { animated: false, frames: 1, durationMs: null };
		return {
			...base,
			...size,
			kind: animation.animated ? 'animated-image' : 'image',
			durationMs: animation.durationMs,
			frameCount: animation.frames
		};
	} catch (error) {
		URL.revokeObjectURL(objectUrl);
		throw error instanceof ImportFailure ? error : new ImportFailure('decode-failed');
	}
}

export async function fetchMediaFromUrl(input: string): Promise<{ blob: Blob; name: string }> {
	const url = parseHttpUrl(input);
	if (!url) throw new ImportFailure('invalid-url');
	let response: Response;
	try {
		response = await fetch(url, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
	} catch {
		throw new ImportFailure('fetch-blocked');
	}
	if (!response.ok) throw new ImportFailure('fetch-failed');
	return { blob: await response.blob(), name: fileNameFromUrl(url) };
}

async function readImageSize(src: string): Promise<{ width: number; height: number }> {
	const image = new Image();
	image.decoding = 'async';
	image.src = src;
	await image.decode();
	if (!image.naturalWidth || !image.naturalHeight) throw new ImportFailure('decode-failed');
	return { width: image.naturalWidth, height: image.naturalHeight };
}

function readVideoMetadata(src: string): Promise<{ width: number; height: number; durationMs: number }> {
	return new Promise((resolve, reject) => {
		const video = document.createElement('video');
		const timer = setTimeout(() => finish(new ImportFailure('decode-failed')), METADATA_TIMEOUT_MS);
		function finish(result: ImportFailure | { width: number; height: number; durationMs: number }) {
			clearTimeout(timer);
			video.removeAttribute('src');
			video.load();
			if (result instanceof ImportFailure) reject(result);
			else resolve(result);
		}
		video.muted = true;
		video.playsInline = true;
		video.preload = 'metadata';
		video.onloadedmetadata = () => {
			if (!video.videoWidth || !Number.isFinite(video.duration)) {
				finish(new ImportFailure('decode-failed'));
				return;
			}
			finish({
				width: video.videoWidth,
				height: video.videoHeight,
				durationMs: Math.round(video.duration * 1000)
			});
		};
		video.onerror = () => finish(new ImportFailure('decode-failed'));
		video.src = src;
	});
}
