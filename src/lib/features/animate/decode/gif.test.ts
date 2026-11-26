import { describe, expect, it } from 'vitest';
import { DecodeError } from './errors.ts';
import { decodeGif } from './gif.ts';

type Rgb = [number, number, number];

type FrameSpec = {
	left?: number;
	top?: number;
	width: number;
	height: number;
	indices: number[];
	palette?: Rgb[];
	delay?: number;
	disposal?: number;
	transparent?: number;
	interlaced?: boolean;
	minCodeSize?: number;
	deferClear?: boolean;
};

type GifSpec = { width: number; height: number; palette?: Rgb[]; frames: FrameSpec[]; loop?: number };

const RED: Rgb = [255, 0, 0];
const GREEN: Rgb = [0, 255, 0];
const BLUE: Rgb = [0, 0, 255];
const WHITE: Rgb = [255, 255, 255];
const PALETTE: Rgb[] = [RED, GREEN, BLUE, WHITE];
const INTERLACED_STORAGE_ORDER = [0, 8, 4, 2, 6, 1, 3, 5, 7, 9];

function u16(value: number): number[] {
	return [value & 0xff, (value >> 8) & 0xff];
}

function ascii(text: string): number[] {
	return [...text].map((char) => char.charCodeAt(0));
}

function colorTable(palette: Rgb[]): { bytes: number[]; sizeBits: number } {
	let sizeBits = 1;
	while (1 << sizeBits < palette.length) sizeBits++;
	const bytes: number[] = [];
	for (let i = 0; i < 1 << sizeBits; i++) bytes.push(...(palette[i] ?? [0, 0, 0]));
	return { bytes, sizeBits: sizeBits - 1 };
}

function lzwEncode(indices: number[], minCodeSize: number, deferClear: boolean): number[] {
	const clearCode = 1 << minCodeSize;
	const endCode = clearCode + 1;
	const out: number[] = [];
	let buffer = 0;
	let bitCount = 0;
	const emit = (code: number, size: number) => {
		buffer |= code << bitCount;
		bitCount += size;
		while (bitCount >= 8) {
			out.push(buffer & 0xff);
			buffer >>>= 8;
			bitCount -= 8;
		}
	};
	let dictionary = new Map<number, number>();
	let nextCode = endCode + 1;
	let size = minCodeSize + 1;
	emit(clearCode, size);
	let prefix = indices[0] as number;
	for (let i = 1; i < indices.length; i++) {
		const symbol = indices[i] as number;
		const key = prefix * 256 + symbol;
		const found = dictionary.get(key);
		if (found !== undefined) {
			prefix = found;
			continue;
		}
		emit(prefix, size);
		if (nextCode < 4096) {
			dictionary.set(key, nextCode);
			if (nextCode === 1 << size && size < 12) size++;
			nextCode++;
		} else if (!deferClear) {
			emit(clearCode, size);
			dictionary = new Map();
			nextCode = endCode + 1;
			size = minCodeSize + 1;
		}
		prefix = symbol;
	}
	emit(prefix, size);
	if (nextCode === 1 << size && size < 12) size++;
	emit(endCode, size);
	if (bitCount > 0) out.push(buffer & 0xff);
	return out;
}

function subBlocks(data: number[]): number[] {
	const out: number[] = [];
	for (let i = 0; i < data.length; i += 255) {
		const part = data.slice(i, i + 255);
		out.push(part.length, ...part);
	}
	out.push(0);
	return out;
}

function storedRows(indices: number[], width: number): number[] {
	return INTERLACED_STORAGE_ORDER.flatMap((row) => indices.slice(row * width, (row + 1) * width));
}

function buildGif(spec: GifSpec): Uint8Array {
	const global = spec.palette ? colorTable(spec.palette) : null;
	const out: number[] = [
		...ascii('GIF89a'),
		...u16(spec.width),
		...u16(spec.height),
		global ? 0x80 | (global.sizeBits << 4) | global.sizeBits : 0,
		0,
		0
	];
	if (global) out.push(...global.bytes);
	if (spec.loop !== undefined) {
		out.push(0x21, 0xff, 11, ...ascii('NETSCAPE2.0'), 3, 1, ...u16(spec.loop), 0);
	}
	out.push(0x21, 0xfe, 3, 120, 120, 120, 0);
	for (const frame of spec.frames) {
		const local = frame.palette ? colorTable(frame.palette) : null;
		const paletteLength = (frame.palette ?? spec.palette ?? PALETTE).length;
		let minCodeSize = 2;
		while (1 << minCodeSize < paletteLength) minCodeSize++;
		minCodeSize = frame.minCodeSize ?? minCodeSize;
		const packed = (frame.disposal ?? 0) << 2;
		out.push(
			0x21,
			0xf9,
			4,
			frame.transparent === undefined ? packed : packed | 1,
			...u16(frame.delay ?? 0),
			frame.transparent ?? 0,
			0
		);
		out.push(
			0x2c,
			...u16(frame.left ?? 0),
			...u16(frame.top ?? 0),
			...u16(frame.width),
			...u16(frame.height),
			(local ? 0x80 | local.sizeBits : 0) | (frame.interlaced ? 0x40 : 0)
		);
		if (local) out.push(...local.bytes);
		const indices = frame.interlaced ? storedRows(frame.indices, frame.width) : frame.indices;
		out.push(minCodeSize, ...subBlocks(lzwEncode(indices, minCodeSize, frame.deferClear ?? false)));
	}
	out.push(0x3b);
	return Uint8Array.from(out);
}

function pixel(rgba: Uint8ClampedArray, width: number, x: number, y: number): number[] {
	const offset = (y * width + x) * 4;
	return [...rgba.subarray(offset, offset + 4)];
}

function opaque(color: Rgb): number[] {
	return [...color, 255];
}

const CLEAR = [0, 0, 0, 0];

function reasonOf(action: () => unknown): string {
	try {
		action();
	} catch (error) {
		if (error instanceof DecodeError) return error.reason;
		throw error;
	}
	return 'none';
}

describe('decodeGif compositing', () => {
	it('decodes full frames, delays and the NETSCAPE loop count', () => {
		const gif = decodeGif(
			buildGif({
				width: 4,
				height: 3,
				palette: PALETTE,
				loop: 3,
				frames: [
					{ width: 4, height: 3, indices: new Array(12).fill(0), delay: 5 },
					{ width: 4, height: 3, indices: new Array(12).fill(1), delay: 10 }
				]
			})
		);
		expect(gif.width).toBe(4);
		expect(gif.height).toBe(3);
		expect(gif.loopCount).toBe(3);
		expect(gif.frames).toHaveLength(2);
		expect(gif.frames[0]?.rgba).toHaveLength(48);
		expect(gif.frames.map((frame) => frame.delayMs)).toEqual([50, 100]);
		expect(pixel(gif.frames[0]?.rgba as Uint8ClampedArray, 4, 3, 2)).toEqual(opaque(RED));
		expect(pixel(gif.frames[1]?.rgba as Uint8ClampedArray, 4, 0, 0)).toEqual(opaque(GREEN));
	});

	it('returns null loopCount without a NETSCAPE extension and applies the delay floor', () => {
		const gif = decodeGif(
			buildGif({
				width: 1,
				height: 1,
				palette: PALETTE,
				frames: [0, 1, 2, 5].map((delay) => ({ width: 1, height: 1, indices: [0], delay }))
			})
		);
		expect(gif.loopCount).toBeNull();
		expect(gif.frames.map((frame) => frame.delayMs)).toEqual([100, 100, 20, 50]);
	});

	it('keeps the previous canvas under transparent pixels and clears a disposal-2 rectangle', () => {
		const gif = decodeGif(
			buildGif({
				width: 4,
				height: 4,
				palette: PALETTE,
				frames: [
					{ width: 4, height: 4, indices: new Array(16).fill(0), delay: 10 },
					{
						left: 1,
						top: 1,
						width: 2,
						height: 2,
						indices: [1, 3, 3, 1],
						transparent: 3,
						disposal: 2,
						delay: 10
					},
					{ left: 0, top: 0, width: 1, height: 1, indices: [2], delay: 10 }
				]
			})
		);
		const second = gif.frames[1]?.rgba as Uint8ClampedArray;
		expect(pixel(second, 4, 1, 1)).toEqual(opaque(GREEN));
		expect(pixel(second, 4, 2, 1)).toEqual(opaque(RED));
		expect(pixel(second, 4, 1, 2)).toEqual(opaque(RED));
		expect(pixel(second, 4, 2, 2)).toEqual(opaque(GREEN));
		const third = gif.frames[2]?.rgba as Uint8ClampedArray;
		expect(pixel(third, 4, 0, 0)).toEqual(opaque(BLUE));
		expect(pixel(third, 4, 1, 1)).toEqual(CLEAR);
		expect(pixel(third, 4, 2, 2)).toEqual(CLEAR);
		expect(pixel(third, 4, 3, 3)).toEqual(opaque(RED));
	});

	it('restores the canvas before the frame for disposal 3', () => {
		const gif = decodeGif(
			buildGif({
				width: 4,
				height: 4,
				palette: PALETTE,
				frames: [
					{ width: 4, height: 4, indices: new Array(16).fill(0), delay: 10 },
					{ width: 2, height: 2, indices: [1, 1, 1, 1], disposal: 3, delay: 10 },
					{ left: 3, top: 3, width: 1, height: 1, indices: [2], delay: 10 }
				]
			})
		);
		expect(pixel(gif.frames[1]?.rgba as Uint8ClampedArray, 4, 0, 0)).toEqual(opaque(GREEN));
		const third = gif.frames[2]?.rgba as Uint8ClampedArray;
		expect(pixel(third, 4, 0, 0)).toEqual(opaque(RED));
		expect(pixel(third, 4, 1, 1)).toEqual(opaque(RED));
		expect(pixel(third, 4, 3, 3)).toEqual(opaque(BLUE));
	});

	it('keeps content for disposal 1 and starts from a transparent canvas', () => {
		const gif = decodeGif(
			buildGif({
				width: 2,
				height: 1,
				palette: PALETTE,
				frames: [
					{ width: 1, height: 1, indices: [0], disposal: 1 },
					{ left: 1, width: 1, height: 1, indices: [1] }
				]
			})
		);
		const first = gif.frames[0]?.rgba as Uint8ClampedArray;
		expect(pixel(first, 2, 1, 0)).toEqual(CLEAR);
		const second = gif.frames[1]?.rgba as Uint8ClampedArray;
		expect(pixel(second, 2, 0, 0)).toEqual(opaque(RED));
		expect(pixel(second, 2, 1, 0)).toEqual(opaque(GREEN));
	});

	it('clips frames that extend beyond the logical screen', () => {
		const gif = decodeGif(
			buildGif({
				width: 2,
				height: 2,
				palette: PALETTE,
				frames: [{ left: 1, top: 1, width: 3, height: 3, indices: new Array(9).fill(2) }]
			})
		);
		const rgba = gif.frames[0]?.rgba as Uint8ClampedArray;
		expect(pixel(rgba, 2, 1, 1)).toEqual(opaque(BLUE));
		expect(pixel(rgba, 2, 0, 0)).toEqual(CLEAR);
		expect(pixel(rgba, 2, 1, 0)).toEqual(CLEAR);
	});

	it('uses a local color table and de-interlaces rows', () => {
		const rows = 10;
		const local: Rgb[] = Array.from({ length: rows }, (_, i) => [i * 20, 0, 255 - i * 20]);
		const gif = decodeGif(
			buildGif({
				width: 2,
				height: rows,
				palette: PALETTE,
				frames: [
					{
						width: 2,
						height: rows,
						palette: local,
						interlaced: true,
						indices: Array.from({ length: rows }, (_, row) => [row, row]).flat()
					}
				]
			})
		);
		const rgba = gif.frames[0]?.rgba as Uint8ClampedArray;
		for (let row = 0; row < rows; row++) {
			expect(pixel(rgba, 2, 1, row)).toEqual(opaque(local[row] as Rgb));
		}
	});
});

describe('decodeGif LZW', () => {
	const size = 120;
	const grays: Rgb[] = Array.from({ length: 256 }, (_, i) => [i, 255 - i, i]);
	let seed = 12345;
	const indices = Array.from({ length: size * size }, () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return (seed >> 16) & 0xff;
	});

	for (const deferClear of [false, true]) {
		it(`round-trips a long stream that fills the code table (deferClear=${deferClear})`, () => {
			const gif = decodeGif(
				buildGif({
					width: size,
					height: size,
					palette: grays,
					frames: [{ width: size, height: size, indices, deferClear }]
				})
			);
			const rgba = gif.frames[0]?.rgba as Uint8ClampedArray;
			for (let i = 0; i < indices.length; i += 7) {
				const color = grays[indices[i] as number] as Rgb;
				expect([...rgba.subarray(i * 4, i * 4 + 4)]).toEqual(opaque(color));
			}
		});
	}
});

describe('decodeGif malformed input', () => {
	const sample = buildGif({
		width: 8,
		height: 8,
		palette: PALETTE,
		frames: [
			{ width: 8, height: 8, indices: Array.from({ length: 64 }, (_, i) => (i * 7) % 4) },
			{ width: 8, height: 8, indices: Array.from({ length: 64 }, (_, i) => (i * 5 + (i >> 3)) % 4) }
		]
	});

	it('rejects empty input, bad signatures and files without frames', () => {
		expect(reasonOf(() => decodeGif(new Uint8Array()))).toBe('invalid');
		expect(
			reasonOf(() => decodeGif(Uint8Array.from(ascii('GIF90a\u0001\u0000\u0001\u0000\u0000\u0000\u0000;'))))
		).toBe('invalid');
		expect(reasonOf(() => decodeGif(buildGif({ width: 1, height: 1, palette: PALETTE, frames: [] })))).toBe(
			'invalid'
		);
	});

	it('rejects an out-of-range minimum code size', () => {
		for (const minCodeSize of [1, 9]) {
			const gif = buildGif({
				width: 2,
				height: 2,
				palette: PALETTE,
				frames: [{ width: 2, height: 2, indices: [0, 1, 2, 3], minCodeSize }]
			});
			expect(reasonOf(() => decodeGif(gif))).toBe('invalid');
		}
	});

	it('returns completed frames when the data is truncated after at least one frame', () => {
		const truncated = sample.subarray(0, sample.length - 10);
		expect(decodeGif(truncated).frames).toHaveLength(1);
	});

	it('throws when truncated before any frame completes', () => {
		expect(reasonOf(() => decodeGif(sample.subarray(0, 60)))).toBe('invalid');
	});

	it('never throws anything but DecodeError for truncated or corrupted bytes', () => {
		const attempt = (bytes: Uint8Array) => {
			try {
				decodeGif(bytes);
			} catch (error) {
				expect(error).toBeInstanceOf(DecodeError);
			}
		};
		for (let length = 0; length < sample.length; length++) attempt(sample.subarray(0, length));
		for (let position = 0; position < sample.length; position++) {
			for (const value of [0x00, 0xff]) {
				const copy = sample.slice();
				copy[position] = value;
				attempt(copy);
			}
		}
	});

	it('enforces frame and pixel limits', () => {
		expect(reasonOf(() => decodeGif(sample, { maxFrames: 1 }))).toBe('too-large');
		expect(reasonOf(() => decodeGif(sample, { maxPixels: 127 }))).toBe('too-large');
		expect(decodeGif(sample, { maxPixels: 128, maxFrames: 2 }).frames).toHaveLength(2);
	});
});
