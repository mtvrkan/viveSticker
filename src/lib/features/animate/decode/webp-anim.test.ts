import { describe, expect, it } from 'vitest';
import { DecodeError } from './errors.ts';
import { splitAnimatedWebp } from './webp-anim.ts';

function u24(value: number): number[] {
	return [value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff];
}

function u32(value: number): number[] {
	return [...u24(value), (value >>> 24) & 0xff];
}

function ascii(text: string): number[] {
	return [...text].map((char) => char.charCodeAt(0));
}

function chunk(type: string, payload: number[]): number[] {
	return [...ascii(type), ...u32(payload.length), ...payload, ...(payload.length & 1 ? [0] : [])];
}

function riff(chunks: number[][]): Uint8Array {
	const body = [...ascii('WEBP'), ...chunks.flat()];
	return Uint8Array.from([...ascii('RIFF'), ...u32(body.length), ...body]);
}

function vp8x(flags: number, width: number, height: number): number[] {
	return chunk('VP8X', [flags, 0, 0, 0, ...u24(width - 1), ...u24(height - 1)]);
}

function anim(background: number, loops: number): number[] {
	return chunk('ANIM', [...u32(background), loops & 0xff, loops >> 8]);
}

type FrameOptions = {
	x?: number;
	y?: number;
	width: number;
	height: number;
	duration: number;
	flags?: number;
	sub: number[][];
};

function anmf(options: FrameOptions): number[] {
	return chunk('ANMF', [
		...u24((options.x ?? 0) / 2),
		...u24((options.y ?? 0) / 2),
		...u24(options.width - 1),
		...u24(options.height - 1),
		...u24(options.duration),
		options.flags ?? 0,
		...options.sub.flat()
	]);
}

function bytesOf(length: number, seed: number): number[] {
	return Array.from({ length }, (_, i) => (seed + i * 13) & 0xff);
}

function parse(webp: Uint8Array): { type: string; payload: number[]; size: number }[] {
	const view = new DataView(webp.buffer, webp.byteOffset, webp.length);
	expect(String.fromCharCode(...webp.subarray(0, 4))).toBe('RIFF');
	expect(view.getUint32(4, true)).toBe(webp.length - 8);
	expect(String.fromCharCode(...webp.subarray(8, 12))).toBe('WEBP');
	expect(webp.length % 2).toBe(0);
	const chunks: { type: string; payload: number[]; size: number }[] = [];
	let pos = 12;
	while (pos < webp.length) {
		const size = view.getUint32(pos + 4, true);
		chunks.push({
			type: String.fromCharCode(...webp.subarray(pos, pos + 4)),
			payload: [...webp.subarray(pos + 8, pos + 8 + size)],
			size
		});
		pos += 8 + size + (size & 1);
	}
	return chunks;
}

function reasonOf(action: () => unknown): string {
	try {
		action();
	} catch (error) {
		if (error instanceof DecodeError) return error.reason;
		throw error;
	}
	return 'none';
}

const lossy = bytesOf(21, 1);
const alpha = bytesOf(9, 40);
const lossless = bytesOf(14, 90);

function animated(): Uint8Array {
	return riff([
		vp8x(0x12, 100, 80),
		anim(0xff112233, 300),
		chunk('EXIF', [1, 2, 3]),
		anmf({ width: 10, height: 6, duration: 40, flags: 0, sub: [chunk('VP8 ', lossy)] }),
		anmf({
			x: 20,
			y: 10,
			width: 7,
			height: 5,
			duration: 5,
			flags: 0x03,
			sub: [chunk('UNKN', [9, 9, 9]), chunk('ALPH', alpha), chunk('VP8 ', lossy)]
		}),
		anmf({
			x: 98,
			y: 78,
			width: 2,
			height: 2,
			duration: 0x123456,
			flags: 0x02,
			sub: [chunk('VP8L', lossless)]
		})
	]);
}

describe('splitAnimatedWebp', () => {
	it('reads canvas, loop count, background and per-frame metadata', () => {
		const result = splitAnimatedWebp(animated());

		expect(result.width).toBe(100);
		expect(result.height).toBe(80);
		expect(result.loopCount).toBe(300);
		expect(result.background).toBe(0xff112233);
		expect(result.frames).toHaveLength(3);
		expect(result.frames.map((frame) => [frame.x, frame.y, frame.width, frame.height])).toEqual([
			[0, 0, 10, 6],
			[20, 10, 7, 5],
			[98, 78, 2, 2]
		]);
		expect(result.frames.map((frame) => frame.durationMs)).toEqual([40, 100, 0x123456]);
		expect(result.frames.map((frame) => frame.blend)).toEqual([true, false, false]);
		expect(result.frames.map((frame) => frame.dispose)).toEqual([false, true, false]);
	});

	it('emits a bare VP8 or VP8L chunk when there is no alpha', () => {
		const result = splitAnimatedWebp(animated());

		const lossyChunks = parse((result.frames[0] as { webp: Uint8Array }).webp);
		const losslessChunks = parse((result.frames[2] as { webp: Uint8Array }).webp);

		expect(lossyChunks).toEqual([{ type: 'VP8 ', payload: lossy, size: 21 }]);
		expect(losslessChunks).toEqual([{ type: 'VP8L', payload: lossless, size: 14 }]);
	});

	it('wraps VP8 with ALPH into VP8X sized to the frame', () => {
		const result = splitAnimatedWebp(animated());

		const chunks = parse((result.frames[1] as { webp: Uint8Array }).webp);

		expect(chunks.map((entry) => entry.type)).toEqual(['VP8X', 'ALPH', 'VP8 ']);
		expect(chunks[0]?.payload).toEqual([0x10, 0, 0, 0, ...u24(6), ...u24(4)]);
		expect(chunks[1]).toEqual({ type: 'ALPH', payload: alpha, size: 9 });
		expect(chunks[2]).toEqual({ type: 'VP8 ', payload: lossy, size: 21 });
	});

	it('ignores ALPH next to a VP8L image', () => {
		const result = splitAnimatedWebp(
			riff([
				vp8x(0x12, 4, 4),
				anim(0, 0),
				anmf({ width: 4, height: 4, duration: 20, sub: [chunk('ALPH', alpha), chunk('VP8L', lossless)] })
			])
		);

		expect(parse((result.frames[0] as { webp: Uint8Array }).webp).map((entry) => entry.type)).toEqual([
			'VP8L'
		]);
	});

	it('maps durations below 10 ms to 100 ms', () => {
		const frame = (duration: number) =>
			anmf({ width: 2, height: 2, duration, sub: [chunk('VP8L', lossless)] });

		const result = splitAnimatedWebp(riff([vp8x(0x12, 2, 2), anim(0, 0), frame(0), frame(9), frame(10)]));

		expect(result.frames.map((entry) => entry.durationMs)).toEqual([100, 100, 10]);
	});
});

describe('splitAnimatedWebp errors', () => {
	it('throws not-animated for still images and missing frames', () => {
		const still = riff([chunk('VP8 ', lossy)]);
		const noFlag = riff([vp8x(0x10, 4, 4), chunk('VP8 ', lossy)]);
		const noFrames = riff([vp8x(0x12, 4, 4), anim(0, 0)]);

		expect(reasonOf(() => splitAnimatedWebp(still))).toBe('not-animated');
		expect(reasonOf(() => splitAnimatedWebp(noFlag))).toBe('not-animated');
		expect(reasonOf(() => splitAnimatedWebp(noFrames))).toBe('not-animated');
	});

	it('throws invalid for non-RIFF, truncated or malformed input', () => {
		const good = animated();

		expect(reasonOf(() => splitAnimatedWebp(new Uint8Array()))).toBe('invalid');
		expect(
			reasonOf(() => splitAnimatedWebp(Uint8Array.from(ascii('RIFX\u0004\u0000\u0000\u0000WEBP'))))
		).toBe('invalid');
		expect(reasonOf(() => splitAnimatedWebp(good.subarray(0, good.length - 3)))).toBe('invalid');
	});

	it('throws invalid when a frame leaves the canvas or lacks image data', () => {
		const outside = riff([
			vp8x(0x12, 4, 4),
			anim(0, 0),
			anmf({ x: 2, width: 3, height: 2, duration: 10, sub: [chunk('VP8L', lossless)] })
		]);
		const empty = riff([
			vp8x(0x12, 4, 4),
			anim(0, 0),
			anmf({ width: 2, height: 2, duration: 10, sub: [chunk('ALPH', alpha)] })
		]);
		const overrun = riff([vp8x(0x12, 4, 4), anim(0, 0), chunk('ANMF', [0, 0, 0])]);

		expect(reasonOf(() => splitAnimatedWebp(outside))).toBe('invalid');
		expect(reasonOf(() => splitAnimatedWebp(empty))).toBe('invalid');
		expect(reasonOf(() => splitAnimatedWebp(overrun))).toBe('invalid');
	});

	it('never throws anything but DecodeError for truncated input', () => {
		const good = animated();

		for (let length = 0; length < good.length; length++) {
			try {
				splitAnimatedWebp(good.subarray(0, length));
			} catch (error) {
				expect(error).toBeInstanceOf(DecodeError);
			}
		}
	});
});
