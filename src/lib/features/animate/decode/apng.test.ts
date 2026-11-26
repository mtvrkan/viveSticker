import { deflateSync, inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { crc32 } from '#lib/core/binary/crc32.ts';
import { splitApng } from './apng.ts';
import { DecodeError } from './errors.ts';

const SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);

function u32(value: number): number[] {
	return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function u16(value: number): number[] {
	return [(value >> 8) & 0xff, value & 0xff];
}

function chunk(type: string, data: ArrayLike<number> = []): Uint8Array {
	const body = Uint8Array.from([...type].map((char) => char.charCodeAt(0)).concat(Array.from(data)));
	return Uint8Array.from([...u32(data.length), ...body, ...u32(crc32(body))]);
}

function concat(parts: Uint8Array[]): Uint8Array {
	return Uint8Array.from(parts.flatMap((part) => Array.from(part)));
}

function ihdr(width: number, height: number): Uint8Array {
	return chunk('IHDR', [...u32(width), ...u32(height), 8, 6, 0, 0, 0]);
}

function imageData(width: number, height: number, seed: number): Uint8Array {
	const raw: number[] = [];
	for (let row = 0; row < height; row++) {
		raw.push(0);
		for (let i = 0; i < width * 4; i++) raw.push((seed + row * 31 + i * 7) & 0xff);
	}
	return deflateSync(Uint8Array.from(raw));
}

type FrameControl = {
	sequence: number;
	width: number;
	height: number;
	x?: number;
	y?: number;
	num?: number;
	den?: number;
	dispose?: number;
	blend?: number;
};

function fctl(control: FrameControl): Uint8Array {
	return chunk('fcTL', [
		...u32(control.sequence),
		...u32(control.width),
		...u32(control.height),
		...u32(control.x ?? 0),
		...u32(control.y ?? 0),
		...u16(control.num ?? 1),
		...u16(control.den ?? 10),
		control.dispose ?? 0,
		control.blend ?? 0
	]);
}

function actl(frames: number, plays: number): Uint8Array {
	return chunk('acTL', [...u32(frames), ...u32(plays)]);
}

function fdat(sequence: number, data: Uint8Array): Uint8Array {
	return chunk('fdAT', [...u32(sequence), ...data]);
}

function parseChunks(png: Uint8Array): { type: string; data: Uint8Array; crcValid: boolean }[] {
	const chunks: { type: string; data: Uint8Array; crcValid: boolean }[] = [];
	let pos = 8;
	while (pos < png.length) {
		const view = new DataView(png.buffer, png.byteOffset + pos);
		const length = view.getUint32(0);
		const type = String.fromCharCode(...png.subarray(pos + 4, pos + 8));
		const data = png.subarray(pos + 8, pos + 8 + length);
		const stored = view.getUint32(8 + length);
		chunks.push({ type, data, crcValid: crc32(png.subarray(pos + 4, pos + 8 + length)) === stored });
		pos += 12 + length;
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

const frameA = imageData(4, 4, 1);
const frameB = imageData(2, 2, 50);
const frameC = imageData(3, 2, 99);
const half = Math.floor(frameA.length / 2);
const cutC = Math.floor(frameC.length / 2);

function animated(): Uint8Array {
	return concat([
		SIGNATURE,
		ihdr(4, 4),
		chunk('gAMA', u32(45455)),
		chunk('tEXt', [75, 0, 86]),
		actl(3, 2),
		fctl({ sequence: 0, width: 4, height: 4, num: 1, den: 10, dispose: 1, blend: 1 }),
		chunk('IDAT', frameA.subarray(0, half)),
		chunk('IDAT', frameA.subarray(half)),
		fctl({ sequence: 1, width: 2, height: 2, x: 1, y: 1, num: 0, den: 0, dispose: 2 }),
		fdat(2, frameB),
		fctl({ sequence: 3, width: 3, height: 2, x: 0, y: 2, num: 5, den: 1000 }),
		fdat(4, frameC.subarray(0, cutC)),
		fdat(5, frameC.subarray(cutC)),
		chunk('IEND')
	]);
}

describe('splitApng', () => {
	it('splits frames with metadata when the default image is frame 0', () => {
		const result = splitApng(animated());

		expect(result.width).toBe(4);
		expect(result.height).toBe(4);
		expect(result.loopCount).toBe(2);
		expect(result.frames).toHaveLength(3);
		expect(result.frames.map((frame) => [frame.x, frame.y, frame.width, frame.height])).toEqual([
			[0, 0, 4, 4],
			[1, 1, 2, 2],
			[0, 2, 3, 2]
		]);
		expect(result.frames.map((frame) => frame.delayMs)).toEqual([100, 100, 100]);
		expect(result.frames.map((frame) => frame.dispose)).toEqual([1, 2, 0]);
		expect(result.frames.map((frame) => frame.blend)).toEqual([1, 0, 0]);
	});

	it('builds valid standalone PNGs with resized IHDR and the frame data', () => {
		const result = splitApng(animated());
		const expectedData = [frameA, frameB, frameC];
		const expectedSizes = [
			[4, 4],
			[2, 2],
			[3, 2]
		];

		result.frames.forEach((frame, index) => {
			expect([...frame.png.subarray(0, 8)]).toEqual([...SIGNATURE]);
			const chunks = parseChunks(frame.png);
			expect(chunks.every((entry) => entry.crcValid)).toBe(true);
			expect(chunks[0]?.type).toBe('IHDR');
			const view = new DataView(chunks[0]?.data.buffer as ArrayBuffer, chunks[0]?.data.byteOffset);
			expect([view.getUint32(0), view.getUint32(4)]).toEqual(expectedSizes[index]);
			expect(chunks.at(-1)?.type).toBe('IEND');
			const types = chunks.map((entry) => entry.type);
			expect(types).toContain('gAMA');
			expect(types).not.toContain('tEXt');
			expect(types).not.toContain('fdAT');
			expect(types).not.toContain('fcTL');
			expect(types).not.toContain('acTL');
			const idat = concat(chunks.filter((entry) => entry.type === 'IDAT').map((entry) => entry.data));
			expect([...idat]).toEqual([...(expectedData[index] as Uint8Array)]);
			const [width, height] = expectedSizes[index] as number[];
			expect(inflateSync(idat)).toHaveLength((height as number) * (1 + (width as number) * 4));
		});
	});

	it('excludes the default image when no fcTL precedes IDAT and rounds delays', () => {
		const png = concat([
			SIGNATURE,
			ihdr(4, 4),
			actl(2, 0),
			chunk('IDAT', frameA),
			fctl({ sequence: 0, width: 2, height: 2, num: 3, den: 100 }),
			fdat(1, frameB),
			fctl({ sequence: 2, width: 2, height: 2, num: 1, den: 3 }),
			fdat(3, frameB),
			chunk('IEND')
		]);

		const result = splitApng(png);

		expect(result.loopCount).toBe(0);
		expect(result.frames.map((frame) => frame.delayMs)).toEqual([30, 333]);
		const idat = parseChunks((result.frames[0] as { png: Uint8Array }).png).find(
			(entry) => entry.type === 'IDAT'
		);
		expect([...(idat?.data as Uint8Array)]).toEqual([...frameB]);
	});

	it('raises very short delays to 100 ms', () => {
		const png = concat([
			SIGNATURE,
			ihdr(4, 4),
			actl(1, 1),
			fctl({ sequence: 0, width: 4, height: 4, num: 5, den: 1000 }),
			chunk('IDAT', frameA),
			chunk('IEND')
		]);

		expect(splitApng(png).frames[0]?.delayMs).toBe(100);
	});
});

describe('splitApng errors', () => {
	it('throws not-animated for a PNG without acTL', () => {
		const png = concat([SIGNATURE, ihdr(4, 4), chunk('IDAT', frameA), chunk('IEND')]);

		expect(reasonOf(() => splitApng(png))).toBe('not-animated');
	});

	it('throws invalid for a bad signature, empty input and truncation', () => {
		const good = animated();
		const badSignature = good.slice();
		badSignature[1] = 0;

		expect(reasonOf(() => splitApng(badSignature))).toBe('invalid');
		expect(reasonOf(() => splitApng(new Uint8Array()))).toBe('invalid');
		expect(reasonOf(() => splitApng(good.subarray(0, good.length - 12)))).toBe('invalid');
		expect(reasonOf(() => splitApng(good.subarray(0, good.length - 5)))).toBe('invalid');
	});

	it('throws invalid on a CRC mismatch', () => {
		const good = animated();
		const corrupted = good.slice();
		const target = good.length - 12 - 20;
		corrupted[target] = (corrupted[target] as number) ^ 0xff;

		expect(reasonOf(() => splitApng(corrupted))).toBe('invalid');
	});

	it('throws invalid when a frame leaves the canvas or has bad ops', () => {
		const build = (control: FrameControl) =>
			concat([SIGNATURE, ihdr(4, 4), actl(1, 1), fctl(control), chunk('IDAT', frameA), chunk('IEND')]);

		expect(reasonOf(() => splitApng(build({ sequence: 0, width: 4, height: 4, x: 1 })))).toBe('invalid');
		expect(reasonOf(() => splitApng(build({ sequence: 0, width: 2, height: 5 })))).toBe('invalid');
		expect(reasonOf(() => splitApng(build({ sequence: 0, width: 4, height: 4, dispose: 3 })))).toBe(
			'invalid'
		);
		expect(reasonOf(() => splitApng(build({ sequence: 0, width: 0, height: 4 })))).toBe('invalid');
	});

	it('throws invalid when the frame count disagrees or fdAT has no fcTL', () => {
		const mismatch = concat([
			SIGNATURE,
			ihdr(4, 4),
			actl(2, 1),
			fctl({ sequence: 0, width: 4, height: 4 }),
			chunk('IDAT', frameA),
			chunk('IEND')
		]);
		const orphan = concat([SIGNATURE, ihdr(4, 4), actl(1, 1), fdat(0, frameB), chunk('IEND')]);

		expect(reasonOf(() => splitApng(mismatch))).toBe('invalid');
		expect(reasonOf(() => splitApng(orphan))).toBe('invalid');
	});
});
