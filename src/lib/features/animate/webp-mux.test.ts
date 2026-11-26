import { describe, expect, it } from 'vitest';
import { muxAnimatedWebp, readStillWebp } from './webp-mux.ts';

const ascii = (text: string): number[] => [...text].map((char) => char.charCodeAt(0));
const u16 = (value: number): number[] => [value & 0xff, (value >>> 8) & 0xff];
const u24 = (value: number): number[] => [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff];
const u32 = (value: number): number[] => [
	value & 0xff,
	(value >>> 8) & 0xff,
	(value >>> 16) & 0xff,
	(value >>> 24) & 0xff
];

function chunk(id: string, data: number[]): Uint8Array {
	const padded = data.length % 2 === 1 ? [...data, 0] : data;
	return Uint8Array.from([...ascii(id), ...u32(data.length), ...padded]);
}

function riff(...chunks: Uint8Array[]): Uint8Array {
	const body = chunks.flatMap((item) => [...item]);
	return Uint8Array.from([...ascii('RIFF'), ...u32(4 + body.length), ...ascii('WEBP'), ...body]);
}

function lossyData(width: number, height: number, filler = 6): number[] {
	return [0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, ...u16(width), ...u16(height), ...Array(filler).fill(0xab)];
}

function losslessData(width: number, height: number, alpha: boolean, filler = 4): number[] {
	const bits = (width - 1) | ((height - 1) << 14) | ((alpha ? 1 : 0) << 28);
	return [0x2f, ...u32(bits >>> 0), ...Array(filler).fill(0xcd)];
}

function vp8x(width: number, height: number, flags = 0): Uint8Array {
	return chunk('VP8X', [flags, 0, 0, 0, ...u24(width - 1), ...u24(height - 1)]);
}

const alphData = [0x01, 0x02, 0x03, 0x04, 0x05];

function stillLossy(width: number, height: number, filler = 6): Uint8Array {
	return riff(chunk('VP8 ', lossyData(width, height, filler)));
}

function stillLossless(width: number, height: number, alpha: boolean): Uint8Array {
	return riff(chunk('VP8L', losslessData(width, height, alpha)));
}

function stillExtendedAlpha(width: number, height: number): Uint8Array {
	return riff(vp8x(width, height, 0x10), chunk('ALPH', alphData), chunk('VP8 ', lossyData(width, height, 7)));
}

type ParsedChunk = { id: string; data: Uint8Array };

function parseChunks(bytes: Uint8Array, start: number, end: number): ParsedChunk[] {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const chunks: ParsedChunk[] = [];
	let pos = start;
	while (pos < end) {
		const id = String.fromCharCode(...bytes.subarray(pos, pos + 4));
		const size = view.getUint32(pos + 4, true);
		chunks.push({ id, data: bytes.subarray(pos + 8, pos + 8 + size) });
		pos += 8 + size + (size % 2);
	}
	expect(pos).toBe(end);
	return chunks;
}

function parseMux(bytes: Uint8Array): ParsedChunk[] {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe('RIFF');
	expect(String.fromCharCode(...bytes.subarray(8, 12))).toBe('WEBP');
	expect(view.getUint32(4, true)).toBe(bytes.length - 8);
	return parseChunks(bytes, 12, bytes.length);
}

function readU24(bytes: Uint8Array, offset: number): number {
	return (
		(bytes[offset] as number) | ((bytes[offset + 1] as number) << 8) | ((bytes[offset + 2] as number) << 16)
	);
}

describe('readStillWebp', () => {
	it('reads a simple lossy file and keeps the padded chunk as payload', () => {
		const data = lossyData(32, 16, 7);
		const webp = riff(chunk('VP8 ', data));

		const still = readStillWebp(webp);

		expect(still.width).toBe(32);
		expect(still.height).toBe(16);
		expect(still.hasAlpha).toBe(false);
		expect(still.payload).toEqual(chunk('VP8 ', data));
		expect(still.payload.length % 2).toBe(0);
	});

	it('masks the 14-bit width and height of a lossy frame header', () => {
		const data = lossyData(0xc000 | 20, 0x4000 | 10);

		const still = readStillWebp(riff(chunk('VP8 ', data)));

		expect(still.width).toBe(20);
		expect(still.height).toBe(10);
	});

	it('reads a simple lossless file with and without the alpha bit', () => {
		const opaque = readStillWebp(stillLossless(512, 300, false));
		const translucent = readStillWebp(stillLossless(512, 300, true));

		expect([opaque.width, opaque.height, opaque.hasAlpha]).toEqual([512, 300, false]);
		expect([translucent.width, translucent.height, translucent.hasAlpha]).toEqual([512, 300, true]);
		expect(opaque.payload).toEqual(chunk('VP8L', losslessData(512, 300, false)));
	});

	it('reads an extended file and returns ALPH followed by VP8, skipping other chunks', () => {
		const webp = riff(
			vp8x(64, 48, 0x10 | 0x20 | 0x08),
			chunk('ICCP', [1, 2, 3]),
			chunk('ALPH', alphData),
			chunk('VP8 ', lossyData(64, 48, 7)),
			chunk('EXIF', [9, 9, 9])
		);

		const still = readStillWebp(webp);

		expect([still.width, still.height, still.hasAlpha]).toEqual([64, 48, true]);
		expect(still.payload).toEqual(
			Uint8Array.from([...chunk('ALPH', alphData), ...chunk('VP8 ', lossyData(64, 48, 7))])
		);
	});

	it('reads an extended lossless file and skips unknown chunks', () => {
		const webp = riff(
			vp8x(40, 30, 0x10),
			chunk('ZZZZ', [1, 2, 3, 4, 5]),
			chunk('VP8L', losslessData(40, 30, true))
		);

		const still = readStillWebp(webp);

		expect([still.width, still.height, still.hasAlpha]).toEqual([40, 30, true]);
		expect(still.payload).toEqual(chunk('VP8L', losslessData(40, 30, true)));
	});

	it('reads from a subarray with a non-zero byte offset', () => {
		const webp = stillLossy(8, 8);
		const host = new Uint8Array(webp.length + 5);
		host.set(webp, 3);

		const still = readStillWebp(host.subarray(3, 3 + webp.length));

		expect([still.width, still.height]).toEqual([8, 8]);
	});

	it('copies the payload instead of aliasing the input', () => {
		const webp = stillLossy(8, 8);

		const still = readStillWebp(webp);
		webp.fill(0);

		expect(still.payload[0]).toBe('V'.charCodeAt(0));
	});

	it.each([
		['empty input', new Uint8Array()],
		['too short', new Uint8Array(11)],
		['wrong RIFF tag', Uint8Array.from([...ascii('RIFX'), ...u32(4), ...ascii('WEBP')])],
		['wrong WEBP tag', Uint8Array.from([...ascii('RIFF'), ...u32(4), ...ascii('WEBX')])],
		['riff size beyond buffer', stillLossy(8, 8).subarray(0, 20)],
		['no image chunk', riff(vp8x(8, 8), chunk('EXIF', [1, 2]))],
		['empty body', riff()],
		[
			'truncated chunk header',
			Uint8Array.from([...ascii('RIFF'), ...u32(8), ...ascii('WEBP'), ...ascii('VP8 ')])
		],
		[
			'chunk size beyond riff',
			Uint8Array.from([...ascii('RIFF'), ...u32(12), ...ascii('WEBP'), ...ascii('VP8 '), ...u32(100)])
		],
		['unknown first chunk', riff(chunk('EXIF', [1, 2]), chunk('VP8 ', lossyData(8, 8)))],
		['bad lossy start code', riff(chunk('VP8 ', [0x10, 0x02, 0x00, 0x9d, 0x01, 0x2b, ...u16(8), ...u16(8)]))],
		[
			'inter-frame lossy header',
			riff(chunk('VP8 ', [0x11, 0x02, 0x00, 0x9d, 0x01, 0x2a, ...u16(8), ...u16(8)]))
		],
		['truncated lossy header', riff(chunk('VP8 ', [0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, 8, 0]))],
		['zero lossy width', riff(chunk('VP8 ', lossyData(0, 8)))],
		['bad lossless signature', riff(chunk('VP8L', [0x2e, 0, 0, 0, 0]))],
		['truncated lossless header', riff(chunk('VP8L', [0x2f, 0, 0]))],
		['lossless version bits set', riff(chunk('VP8L', [0x2f, 0, 0, 0, 0x20]))],
		['VP8X too small', riff(chunk('VP8X', [0, 0, 0, 0, 0, 0]), chunk('VP8 ', lossyData(8, 8)))],
		['second VP8X', riff(vp8x(8, 8), vp8x(8, 8), chunk('VP8 ', lossyData(8, 8)))],
		[
			'duplicate ALPH',
			riff(vp8x(8, 8), chunk('ALPH', [1, 2]), chunk('ALPH', [1, 2]), chunk('VP8 ', lossyData(8, 8)))
		]
	])('throws webp-invalid for %s', (_name, bytes) => {
		expect(() => readStillWebp(bytes)).toThrow('webp-invalid');
	});

	it('throws webp-animated when the VP8X animation flag is set', () => {
		const webp = riff(vp8x(8, 8, 0x02), chunk('VP8 ', lossyData(8, 8)));

		expect(() => readStillWebp(webp)).toThrow('webp-animated');
	});

	it('throws webp-animated when an ANMF chunk is present', () => {
		const webp = riff(vp8x(8, 8), chunk('ANIM', [0, 0, 0, 0, 0, 0]), chunk('ANMF', Array(16).fill(0)));

		expect(() => readStillWebp(webp)).toThrow('webp-animated');
	});
});

describe('muxAnimatedWebp', () => {
	it('builds VP8X, ANIM and one ANMF per frame with the payload embedded verbatim', () => {
		const first = stillLossy(16, 8, 7);
		const second = stillLossless(10, 12, false);
		const third = stillExtendedAlpha(6, 4);
		const frames = [
			{ webp: first, durationMs: 40 },
			{ webp: second, durationMs: 80, x: 4, y: 2 },
			{ webp: third, durationMs: 120, x: 10, y: 12 }
		];

		const out = muxAnimatedWebp(frames, { width: 20, height: 20 });
		const chunks = parseMux(out);

		expect(chunks.map((item) => item.id)).toEqual(['VP8X', 'ANMF', 'ANMF', 'ANMF'].toSpliced(1, 0, 'ANIM'));
		const [vp8xChunk, animChunk, ...anmf] = chunks as [ParsedChunk, ParsedChunk, ...ParsedChunk[]];
		expect(vp8xChunk.data.length).toBe(10);
		expect(vp8xChunk.data[0]).toBe(0x02 | 0x10);
		expect([...vp8xChunk.data.subarray(1, 4)]).toEqual([0, 0, 0]);
		expect(readU24(vp8xChunk.data, 4)).toBe(19);
		expect(readU24(vp8xChunk.data, 7)).toBe(19);
		expect(animChunk.data.length).toBe(6);
		expect(new DataView(animChunk.data.buffer, animChunk.data.byteOffset, 6).getUint32(0, true)).toBe(0);
		expect(new DataView(animChunk.data.buffer, animChunk.data.byteOffset, 6).getUint16(4, true)).toBe(0);

		const expected = [
			{ x: 0, y: 0, width: 16, height: 8, duration: 40, source: first },
			{ x: 4, y: 2, width: 10, height: 12, duration: 80, source: second },
			{ x: 10, y: 12, width: 6, height: 4, duration: 120, source: third }
		];
		expect(anmf).toHaveLength(3);
		anmf.forEach((item, index) => {
			const want = expected[index] as (typeof expected)[number];
			expect(readU24(item.data, 0)).toBe(want.x / 2);
			expect(readU24(item.data, 3)).toBe(want.y / 2);
			expect(readU24(item.data, 6)).toBe(want.width - 1);
			expect(readU24(item.data, 9)).toBe(want.height - 1);
			expect(readU24(item.data, 12)).toBe(want.duration);
			expect(item.data[15]).toBe(0);
			expect(item.data.subarray(16)).toEqual(readStillWebp(want.source).payload);
		});
		expect(anmf[2]?.data.subarray(16, 24)).toEqual(chunk('ALPH', alphData).subarray(0, 8));
	});

	it('leaves the alpha flag clear when no frame has alpha', () => {
		const out = muxAnimatedWebp([{ webp: stillLossy(8, 8), durationMs: 10 }], { width: 8, height: 8 });

		expect(parseMux(out)[0]?.data[0]).toBe(0x02);
	});

	it('sets the alpha flag when a lossless frame uses alpha', () => {
		const out = muxAnimatedWebp(
			[
				{ webp: stillLossy(8, 8), durationMs: 10 },
				{ webp: stillLossless(8, 8, true), durationMs: 10 }
			],
			{ width: 8, height: 8 }
		);

		expect(parseMux(out)[0]?.data[0]).toBe(0x12);
	});

	it('writes loop count and background color', () => {
		const out = muxAnimatedWebp([{ webp: stillLossy(8, 8), durationMs: 10 }], {
			width: 8,
			height: 8,
			loopCount: 3,
			background: 0xff112233
		});

		const anim = parseMux(out)[1] as ParsedChunk;
		const view = new DataView(anim.data.buffer, anim.data.byteOffset, anim.data.byteLength);
		expect(view.getUint32(0, true)).toBe(0xff112233);
		expect(view.getUint16(4, true)).toBe(3);
	});

	it('encodes blend and dispose flags', () => {
		const webp = stillLossy(8, 8);

		const out = muxAnimatedWebp(
			[
				{ webp, durationMs: 10, blend: false },
				{ webp, durationMs: 10, dispose: true },
				{ webp, durationMs: 10, blend: false, dispose: true },
				{ webp, durationMs: 10, blend: true, dispose: false }
			],
			{ width: 8, height: 8 }
		);

		expect(
			parseMux(out)
				.slice(2)
				.map((item) => item.data[15])
		).toEqual([0x02, 0x01, 0x03, 0x00]);
	});

	it('rounds and clamps durations', () => {
		const webp = stillLossy(8, 8);

		const out = muxAnimatedWebp(
			[
				{ webp, durationMs: 33.4 },
				{ webp, durationMs: 33.5 },
				{ webp, durationMs: 0 },
				{ webp, durationMs: -5 },
				{ webp, durationMs: Number.NaN },
				{ webp, durationMs: 1e9 }
			],
			{ width: 8, height: 8 }
		);

		expect(
			parseMux(out)
				.slice(2)
				.map((item) => readU24(item.data, 12))
		).toEqual([33, 34, 1, 1, 1, 0xffffff]);
	});

	it('keeps chunk sizes even when frame data has an odd length', () => {
		const out = muxAnimatedWebp([{ webp: stillLossy(8, 8, 7), durationMs: 10 }], { width: 8, height: 8 });

		const anmf = parseMux(out)[2] as ParsedChunk;
		expect(anmf.data.length % 2).toBe(0);
		expect(out.length % 2).toBe(0);
	});

	it('throws webp-no-frames for an empty frame list', () => {
		expect(() => muxAnimatedWebp([], { width: 8, height: 8 })).toThrow('webp-no-frames');
	});

	it.each([
		[1, 0],
		[0, 3],
		[-1, 0],
		[1.5, 0]
	])('throws webp-odd-offset for offset (%s, %s)', (x, y) => {
		expect(() =>
			muxAnimatedWebp([{ webp: stillLossy(4, 4), durationMs: 10, x, y }], { width: 16, height: 16 })
		).toThrow('webp-odd-offset');
	});

	it.each([
		['wider than canvas', 4, 4, 0, 0, 3, 8],
		['taller than canvas', 4, 4, 0, 0, 8, 3],
		['beyond the right edge', 4, 4, 6, 0, 8, 8],
		['beyond the bottom edge', 4, 4, 0, 6, 8, 8],
		['negative offset', 4, 4, -2, 0, 8, 8]
	])(
		'throws webp-frame-bounds when a frame is %s',
		(_name, width, height, x, y, canvasWidth, canvasHeight) => {
			expect(() =>
				muxAnimatedWebp([{ webp: stillLossy(width, height), durationMs: 10, x, y }], {
					width: canvasWidth,
					height: canvasHeight
				})
			).toThrow('webp-frame-bounds');
		}
	);

	it('accepts a frame that exactly fills the canvas edge', () => {
		expect(() =>
			muxAnimatedWebp([{ webp: stillLossy(4, 4), durationMs: 10, x: 4, y: 4 }], { width: 8, height: 8 })
		).not.toThrow();
	});

	it('rejects animated and malformed frame input', () => {
		const animated = riff(vp8x(8, 8, 0x02), chunk('VP8 ', lossyData(8, 8)));

		expect(() => muxAnimatedWebp([{ webp: animated, durationMs: 10 }], { width: 8, height: 8 })).toThrow(
			'webp-animated'
		);
		expect(() =>
			muxAnimatedWebp([{ webp: new Uint8Array(4), durationMs: 10 }], { width: 8, height: 8 })
		).toThrow('webp-invalid');
	});

	it('round-trips through readStillWebp as animated', () => {
		const out = muxAnimatedWebp([{ webp: stillLossy(8, 8), durationMs: 10 }], { width: 8, height: 8 });

		expect(() => readStillWebp(out)).toThrow('webp-animated');
	});
});
