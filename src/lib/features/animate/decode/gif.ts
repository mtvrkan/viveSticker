import { DecodeError } from './errors.ts';

export type GifFrame = { rgba: Uint8ClampedArray; delayMs: number };
export type DecodedGif = { width: number; height: number; frames: GifFrame[]; loopCount: number | null };

const DEFAULT_MAX_FRAMES = 1000;
const DEFAULT_MAX_PIXELS = 150_000_000;
const MIN_DELAY_MS = 20;
const FALLBACK_DELAY_MS = 100;
const MAX_CODE_BITS = 12;
const TABLE_SIZE = 1 << MAX_CODE_BITS;
const INTERLACE_PASSES: readonly (readonly [number, number])[] = [
	[0, 8],
	[4, 8],
	[2, 4],
	[1, 2]
];

type Control = { delayMs: number; disposal: number; transparent: number };
type Previous = {
	disposal: number;
	left: number;
	top: number;
	width: number;
	height: number;
	snapshot: Uint8ClampedArray | null;
};

const invalid = () => new DecodeError('invalid');
const tooLarge = () => new DecodeError('too-large');

class Reader {
	pos = 0;

	constructor(readonly bytes: Uint8Array) {}

	u8(): number {
		const value = this.bytes[this.pos];
		if (value === undefined) throw invalid();
		this.pos++;
		return value;
	}

	u16(): number {
		const low = this.u8();
		return low | (this.u8() << 8);
	}

	take(length: number): Uint8Array {
		const end = this.pos + length;
		if (end > this.bytes.length) throw invalid();
		const chunk = this.bytes.subarray(this.pos, end);
		this.pos = end;
		return chunk;
	}

	block(): Uint8Array | null {
		const size = this.u8();
		return size === 0 ? null : this.take(size);
	}

	skipBlocks(): void {
		for (let size = this.u8(); size !== 0; size = this.u8()) this.take(size);
	}

	joinBlocks(): Uint8Array {
		const parts: Uint8Array[] = [];
		let total = 0;
		for (let part = this.block(); part; part = this.block()) {
			parts.push(part);
			total += part.length;
		}
		const joined = new Uint8Array(total);
		let offset = 0;
		for (const part of parts) {
			joined.set(part, offset);
			offset += part.length;
		}
		return joined;
	}
}

function lzwDecode(data: Uint8Array, minCodeSize: number, pixelCount: number): Uint8Array {
	const clearCode = 1 << minCodeSize;
	const endCode = clearCode + 1;
	const prefix = new Uint16Array(TABLE_SIZE);
	const suffix = new Uint8Array(TABLE_SIZE);
	const first = new Uint8Array(TABLE_SIZE);
	const lengths = new Uint16Array(TABLE_SIZE);
	for (let i = 0; i < clearCode; i++) {
		suffix[i] = i;
		first[i] = i;
		lengths[i] = 1;
	}
	const capacity = pixelCount + TABLE_SIZE;
	let out = new Uint8Array(Math.min(pixelCount, 65536) + TABLE_SIZE);
	let pos = 0;
	let offset = 0;
	let bitBuffer = 0;
	let bitCount = 0;
	let codeSize = minCodeSize + 1;
	let nextCode = endCode + 1;
	let previous = -1;

	while (pos < pixelCount) {
		while (bitCount < codeSize) {
			const byte = data[offset++];
			if (byte === undefined) return out.subarray(0, pos);
			bitBuffer |= byte << bitCount;
			bitCount += 8;
		}
		const code = bitBuffer & ((1 << codeSize) - 1);
		bitBuffer >>>= codeSize;
		bitCount -= codeSize;

		if (code === clearCode) {
			codeSize = minCodeSize + 1;
			nextCode = endCode + 1;
			previous = -1;
			continue;
		}
		if (code === endCode) break;

		if (previous === -1) {
			if (code >= clearCode) throw invalid();
			out[pos++] = code;
			previous = code;
			continue;
		}
		if (code > nextCode) throw invalid();

		if (nextCode < TABLE_SIZE) {
			prefix[nextCode] = previous;
			suffix[nextCode] = (code < nextCode ? first[code] : first[previous]) as number;
			first[nextCode] = first[previous] as number;
			lengths[nextCode] = (lengths[previous] as number) + 1;
			nextCode++;
			if (nextCode === 1 << codeSize && codeSize < MAX_CODE_BITS) codeSize++;
		}

		const length = lengths[code] as number;
		if (pos + length > out.length) {
			const bigger = new Uint8Array(Math.min(out.length * 2, capacity));
			bigger.set(out);
			out = bigger;
		}
		let write = pos + length - 1;
		let node = code;
		while (write >= pos) {
			out[write] = suffix[node] as number;
			node = prefix[node] as number;
			write--;
		}
		pos += length;
		previous = code;
	}
	return out.subarray(0, Math.min(pos, pixelCount));
}

function rowOrder(height: number, interlaced: boolean): Uint32Array {
	const order = new Uint32Array(height);
	if (!interlaced) {
		for (let i = 0; i < height; i++) order[i] = i;
		return order;
	}
	let index = 0;
	for (const [start, step] of INTERLACE_PASSES) {
		for (let row = start; row < height; row += step) order[index++] = row;
	}
	return order;
}

function clearRect(
	canvas: Uint8ClampedArray,
	width: number,
	height: number,
	rect: { left: number; top: number; width: number; height: number }
): void {
	const xEnd = Math.min(rect.left + rect.width, width);
	const yEnd = Math.min(rect.top + rect.height, height);
	if (rect.left >= xEnd) return;
	for (let y = rect.top; y < yEnd; y++) canvas.fill(0, (y * width + rect.left) * 4, (y * width + xEnd) * 4);
}

function colorTableBytes(packed: number): number {
	return 3 << ((packed & 7) + 1);
}

export function decodeGif(
	bytes: Uint8Array,
	limits: { maxPixels?: number; maxFrames?: number } = {}
): DecodedGif {
	const maxFrames = limits.maxFrames ?? DEFAULT_MAX_FRAMES;
	const maxPixels = limits.maxPixels ?? DEFAULT_MAX_PIXELS;
	const reader = new Reader(bytes);

	const signature = String.fromCharCode(...reader.take(6));
	if (signature !== 'GIF87a' && signature !== 'GIF89a') throw invalid();
	const width = reader.u16();
	const height = reader.u16();
	const screenPacked = reader.u8();
	reader.u8();
	reader.u8();
	if (width === 0 || height === 0) throw invalid();
	if (width * height > maxPixels) throw tooLarge();
	const globalTable = screenPacked & 0x80 ? reader.take(colorTableBytes(screenPacked)) : null;

	const canvas = new Uint8ClampedArray(width * height * 4);
	const frames: GifFrame[] = [];
	const defaultControl: Control = { delayMs: FALLBACK_DELAY_MS, disposal: 0, transparent: -1 };
	let control = defaultControl;
	let previous: Previous | null = null;
	let loopCount: number | null = null;

	try {
		for (;;) {
			const introducer = reader.u8();
			if (introducer === 0x3b) break;

			if (introducer === 0x21) {
				const label = reader.u8();
				const head = reader.block();
				if (label === 0xf9 && head && head.length >= 4) {
					const flags = head[0] as number;
					const delayMs = ((head[1] as number) | ((head[2] as number) << 8)) * 10;
					control = {
						delayMs: delayMs < MIN_DELAY_MS ? FALLBACK_DELAY_MS : delayMs,
						disposal: (flags >> 2) & 7,
						transparent: flags & 1 ? (head[3] as number) : -1
					};
				} else if (label === 0xff && head && head.length >= 11) {
					const appId = String.fromCharCode(...head.subarray(0, 11));
					if (appId === 'NETSCAPE2.0' || appId === 'ANIMEXTS1.0') {
						const sub = reader.block();
						if (sub && sub.length >= 3 && sub[0] === 1)
							loopCount = (sub[1] as number) | ((sub[2] as number) << 8);
					}
				}
				reader.skipBlocks();
				continue;
			}

			if (introducer !== 0x2c) throw invalid();

			const left = reader.u16();
			const top = reader.u16();
			const frameWidth = reader.u16();
			const frameHeight = reader.u16();
			const imagePacked = reader.u8();
			const localTable = imagePacked & 0x80 ? reader.take(colorTableBytes(imagePacked)) : null;
			const table = localTable ?? globalTable;
			const minCodeSize = reader.u8();
			if (minCodeSize < 2 || minCodeSize > 8) throw invalid();

			if (frames.length >= maxFrames) throw tooLarge();
			if (width * height * (frames.length + 1) > maxPixels) throw tooLarge();
			const pixelCount = frameWidth * frameHeight;
			if (pixelCount > maxPixels) throw tooLarge();

			const data = reader.joinBlocks();
			if (!table) throw invalid();
			const indices = lzwDecode(data, minCodeSize, pixelCount);
			if (indices.length < pixelCount) throw invalid();

			if (previous) {
				if (previous.disposal === 2) clearRect(canvas, width, height, previous);
				else if (previous.disposal === 3 && previous.snapshot) canvas.set(previous.snapshot);
			}
			const snapshot = control.disposal === 3 ? canvas.slice() : null;

			const order = rowOrder(frameHeight, (imagePacked & 0x40) !== 0);
			for (let row = 0; row < frameHeight; row++) {
				const y = top + (order[row] as number);
				if (y >= height) continue;
				for (let column = 0; column < frameWidth; column++) {
					const x = left + column;
					if (x >= width) break;
					const index = indices[row * frameWidth + column] as number;
					if (index === control.transparent) continue;
					const entry = index * 3;
					if (entry + 2 >= table.length) continue;
					const target = (y * width + x) * 4;
					canvas[target] = table[entry] as number;
					canvas[target + 1] = table[entry + 1] as number;
					canvas[target + 2] = table[entry + 2] as number;
					canvas[target + 3] = 255;
				}
			}

			frames.push({ rgba: canvas.slice(), delayMs: control.delayMs });
			previous = {
				disposal: control.disposal,
				left,
				top,
				width: frameWidth,
				height: frameHeight,
				snapshot
			};
			control = defaultControl;
		}
	} catch (error) {
		if (!(error instanceof DecodeError)) throw error;
		if (error.reason === 'too-large' || frames.length === 0) throw error;
	}

	if (frames.length === 0) throw invalid();
	return { width, height, frames, loopCount };
}
