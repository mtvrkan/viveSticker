import { describe, expect, it } from 'vitest';
import { fileNameFromUrl, inspectAnimation, parseHttpUrl, resolveMime, validateSize } from './classify.ts';

function gifWithDelays(delays: number[]): Uint8Array {
	const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61];
	const blocks = delays.flatMap((d) => [0x21, 0xf9, 0x04, 0x00, d & 0xff, d >> 8, 0x00, 0x00, 0x2c]);
	return new Uint8Array([...header, ...blocks, 0x3b]);
}

function riffChunk(type: string, payload: number[]): number[] {
	const size = payload.length;
	const padded = size % 2 ? [...payload, 0] : payload;
	return [
		...[...type].map((c) => c.charCodeAt(0)),
		size & 0xff,
		(size >> 8) & 0xff,
		(size >> 16) & 0xff,
		size >>> 24,
		...padded
	];
}

function animatedWebp(durations: number[]): Uint8Array {
	const anim = riffChunk('ANIM', [0, 0, 0, 0, 0, 0]);
	const frames = durations.flatMap((d) =>
		riffChunk('ANMF', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, d & 0xff, (d >> 8) & 0xff, (d >> 16) & 0xff, 0])
	);
	const body = [...'WEBP'].map((c) => c.charCodeAt(0)).concat(anim, frames);
	return new Uint8Array([...[...'RIFF'].map((c) => c.charCodeAt(0)), 0, 0, 0, 0, ...body]);
}

function pngChunk(type: string, data: number[]): number[] {
	const n = data.length;
	return [
		n >>> 24,
		(n >> 16) & 0xff,
		(n >> 8) & 0xff,
		n & 0xff,
		...[...type].map((c) => c.charCodeAt(0)),
		...data,
		0,
		0,
		0,
		0
	];
}

function apng(frameDelays: [number, number][]): Uint8Array {
	const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	const actl = pngChunk('acTL', [0, 0, 0, frameDelays.length, 0, 0, 0, 0]);
	const fctls = frameDelays.flatMap(([num, den]) =>
		pngChunk('fcTL', [...new Array(20).fill(0), num >> 8, num & 0xff, den >> 8, den & 0xff, 0, 0])
	);
	return new Uint8Array([...signature, ...actl, ...fctls, ...pngChunk('IEND', [])]);
}

describe('resolveMime', () => {
	it('accepts a known browser mime type', () => {
		expect(resolveMime('video/mp4', 'clip.mp4')).toBe('video/mp4');
	});

	it('falls back to the extension when Safari reports an empty type', () => {
		expect(resolveMime('', 'IMG_0001.HEIC')).toBe('image/heic');
		expect(resolveMime('application/octet-stream', 'tweet.mov')).toBe('video/quicktime');
	});

	it('rejects unsupported files', () => {
		expect(resolveMime('application/pdf', 'doc.pdf')).toBeNull();
	});
});

describe('validateSize', () => {
	it('flags empty and oversized files', () => {
		expect(validateSize(0, 10)).toBe('empty-file');
		expect(validateSize(11, 10)).toBe('too-large');
		expect(validateSize(10, 10)).toBeNull();
	});
});

describe('inspectAnimation', () => {
	it('counts GIF frames and sums delays, treating tiny delays as 100 ms', () => {
		expect(inspectAnimation(gifWithDelays([5, 5, 0]), 'image/gif')).toEqual({
			animated: true,
			frames: 3,
			durationMs: 200
		});
	});

	it('treats a single-frame GIF as static', () => {
		expect(inspectAnimation(gifWithDelays([0]), 'image/gif').animated).toBe(false);
	});

	it('reads frame count and duration from animated WebP', () => {
		expect(inspectAnimation(animatedWebp([40, 40, 120]), 'image/webp')).toEqual({
			animated: true,
			frames: 3,
			durationMs: 200
		});
	});

	it('reads frame count and duration from APNG', () => {
		expect(
			inspectAnimation(
				apng([
					[1, 10],
					[1, 10],
					[50, 0]
				]),
				'image/png'
			)
		).toEqual({
			animated: true,
			frames: 3,
			durationMs: 700
		});
	});

	it('treats a plain PNG without acTL as static', () => {
		const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...pngChunk('IEND', [])]);
		expect(inspectAnimation(png, 'image/png').animated).toBe(false);
	});

	it('survives truncated input', () => {
		expect(inspectAnimation(new Uint8Array([0x52, 0x49]), 'image/webp').animated).toBe(false);
	});
});

describe('url helpers', () => {
	it('only accepts http and https links', () => {
		expect(parseHttpUrl('https://example.com/a.gif')?.hostname).toBe('example.com');
		expect(parseHttpUrl('javascript:alert(1)')).toBeNull();
		expect(parseHttpUrl('not a url')).toBeNull();
	});

	it('derives a file name from the url path', () => {
		expect(fileNameFromUrl(new URL('https://x.test/media/cat%20dance.gif?x=1'))).toBe('cat dance.gif');
		expect(fileNameFromUrl(new URL('https://x.test/'))).toBe('download');
	});
});
