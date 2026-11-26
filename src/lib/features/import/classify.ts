import type { ImportErrorReason } from '#lib/core/types.ts';

export type MediaFamily = 'image' | 'video';

export type AnimationInfo = {
	animated: boolean;
	frames: number | null;
	durationMs: number | null;
};

const imageExtensions: Record<string, string> = {
	png: 'image/png',
	apng: 'image/apng',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	gif: 'image/gif',
	avif: 'image/avif',
	heic: 'image/heic',
	heif: 'image/heif'
};

const videoExtensions: Record<string, string> = {
	mp4: 'video/mp4',
	m4v: 'video/mp4',
	mov: 'video/quicktime',
	webm: 'video/webm'
};

const supportedImageMimes = new Set(Object.values(imageExtensions));
const supportedVideoMimes = new Set(Object.values(videoExtensions));

const GIF_DEFAULT_DELAY_CS = 10;

export function resolveMime(type: string, name: string): string | null {
	const normalized = type.toLowerCase().split(';')[0]?.trim() ?? '';
	if (supportedImageMimes.has(normalized) || supportedVideoMimes.has(normalized)) return normalized;
	const extension = name.toLowerCase().split('.').pop() ?? '';
	return imageExtensions[extension] ?? videoExtensions[extension] ?? null;
}

export function familyOf(mime: string): MediaFamily {
	return mime.startsWith('video/') ? 'video' : 'image';
}

export function mayBeAnimated(mime: string): boolean {
	return mime === 'image/gif' || mime === 'image/webp' || mime === 'image/png' || mime === 'image/apng';
}

export function validateSize(bytes: number, maxBytes: number): ImportErrorReason | null {
	if (bytes === 0) return 'empty-file';
	if (bytes > maxBytes) return 'too-large';
	return null;
}

export function parseHttpUrl(input: string): URL | null {
	try {
		const url = new URL(input.trim());
		return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
	} catch {
		return null;
	}
}

export function fileNameFromUrl(url: URL): string {
	const last = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '');
	return last || 'download';
}

export function inspectAnimation(bytes: Uint8Array, mime: string): AnimationInfo {
	if (mime === 'image/gif') return inspectGif(bytes);
	if (mime === 'image/webp') return inspectWebp(bytes);
	if (mime === 'image/png' || mime === 'image/apng') return inspectPng(bytes);
	return { animated: false, frames: 1, durationMs: null };
}

function inspectGif(bytes: Uint8Array): AnimationInfo {
	let frames = 0;
	let totalCs = 0;
	for (let i = 0; i + 5 < bytes.length; i++) {
		if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) {
			const delay = (bytes[i + 4] ?? 0) | ((bytes[i + 5] ?? 0) << 8);
			totalCs += delay < 2 ? GIF_DEFAULT_DELAY_CS : delay;
			frames++;
			i += 7;
		}
	}
	if (frames <= 1) return { animated: false, frames: 1, durationMs: null };
	return { animated: true, frames, durationMs: totalCs * 10 };
}

function fourcc(bytes: Uint8Array, at: number): string {
	return String.fromCharCode(bytes[at] ?? 0, bytes[at + 1] ?? 0, bytes[at + 2] ?? 0, bytes[at + 3] ?? 0);
}

function inspectWebp(bytes: Uint8Array): AnimationInfo {
	if (fourcc(bytes, 0) !== 'RIFF' || fourcc(bytes, 8) !== 'WEBP') {
		return { animated: false, frames: 1, durationMs: null };
	}
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let offset = 12;
	let frames = 0;
	let durationMs = 0;
	while (offset + 8 <= bytes.length) {
		const type = fourcc(bytes, offset);
		const size = view.getUint32(offset + 4, true);
		const payload = offset + 8;
		if (type === 'ANMF' && payload + 15 <= bytes.length) {
			frames++;
			durationMs +=
				(bytes[payload + 12] ?? 0) | ((bytes[payload + 13] ?? 0) << 8) | ((bytes[payload + 14] ?? 0) << 16);
		}
		offset = payload + size + (size % 2);
	}
	if (frames <= 1) return { animated: false, frames: 1, durationMs: null };
	return { animated: true, frames, durationMs };
}

function inspectPng(bytes: Uint8Array): AnimationInfo {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let offset = 8;
	let frames = 0;
	let durationMs = 0;
	let hasAnimationControl = false;
	while (offset + 12 <= bytes.length) {
		const length = view.getUint32(offset);
		const type = fourcc(bytes, offset + 4);
		const data = offset + 8;
		if (type === 'acTL') hasAnimationControl = true;
		if (type === 'fcTL' && data + 24 <= bytes.length) {
			frames++;
			const numerator = view.getUint16(data + 20);
			const denominator = view.getUint16(data + 22) || 100;
			durationMs += (numerator / denominator) * 1000;
		}
		if (type === 'IEND') break;
		offset = data + length + 4;
	}
	if (!hasAnimationControl || frames <= 1) return { animated: false, frames: 1, durationMs: null };
	return { animated: true, frames, durationMs: Math.round(durationMs) };
}
