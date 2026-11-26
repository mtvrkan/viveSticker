import type { ImportErrorReason, SourceMedia } from '#lib/core/types.ts';
import { newId } from '#lib/core/id.ts';
import { INPUT_MAX_BYTES } from '#lib/core/whatsapp.ts';
import {
	familyOf,
	fileNameFromUrl,
	inspectAnimation,
	isWebPageType,
	mayBeAnimated,
	parseHttpUrl,
	resolveMime,
	validateSize
} from './classify.ts';
import { isXUrl, pickXMedia, X_MEDIA_API, xPostFromUrl, type XPost } from './x-link.ts';

const METADATA_TIMEOUT_MS = 15_000;
const UNKNOWN_DURATION_PROBE_S = 1e7;
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
		const base = { id: newId(), blob, name, mime, bytes: blob.size, objectUrl };
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
	const post = xPostFromUrl(url);
	if (post) return fetchXMedia(post);
	if (isXUrl(url)) throw new ImportFailure('x-unavailable');
	return download(url.href, fileNameFromUrl(url));
}

async function fetchXMedia(post: XPost): Promise<{ blob: Blob; name: string }> {
	let payload: unknown;
	try {
		const response = await fetch(`${X_MEDIA_API}${post.id}`, {
			credentials: 'omit',
			referrerPolicy: 'no-referrer'
		});
		payload = await response.json();
	} catch {
		throw new ImportFailure('fetch-failed');
	}
	const media = pickXMedia(payload, post);
	if (!media) throw new ImportFailure('x-unavailable');
	return download(media.url, media.name);
}

async function download(href: string, name: string): Promise<{ blob: Blob; name: string }> {
	let response: Response;
	try {
		response = await fetch(href, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
	} catch {
		throw new ImportFailure('fetch-blocked');
	}
	if (!response.ok) throw new ImportFailure('fetch-failed');
	if (isWebPageType(response.headers.get('content-type'))) throw new ImportFailure('not-media');
	return { blob: await response.blob(), name };
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
		function report() {
			finish({
				width: video.videoWidth,
				height: video.videoHeight,
				durationMs: Math.round(video.duration * 1000)
			});
		}
		video.onloadedmetadata = () => {
			if (!video.videoWidth) {
				finish(new ImportFailure('decode-failed'));
				return;
			}
			if (Number.isFinite(video.duration)) {
				report();
				return;
			}
			video.ondurationchange = () => {
				if (Number.isFinite(video.duration)) report();
			};
			if (video.duration === Infinity) video.currentTime = UNKNOWN_DURATION_PROBE_S;
		};
		video.onerror = () => finish(new ImportFailure('decode-failed'));
		video.src = src;
	});
}
