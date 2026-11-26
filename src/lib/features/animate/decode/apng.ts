import { crc32 } from '#lib/core/binary/crc32.ts';
import { DecodeError } from './errors.ts';

export type ApngFrame = {
	png: Uint8Array;
	x: number;
	y: number;
	width: number;
	height: number;
	delayMs: number;
	dispose: 0 | 1 | 2;
	blend: 0 | 1;
};
export type SplitApng = { width: number; height: number; loopCount: number; frames: ApngFrame[] };

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const COPIED_TYPES = new Set(['PLTE', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'sBIT']);
const MAX_CHUNK_LENGTH = 0x7fffffff;
const MIN_DELAY_MS = 10;
const FALLBACK_DELAY_MS = 100;
const IHDR_LENGTH = 13;
const FCTL_LENGTH = 26;

type PendingFrame = {
	width: number;
	height: number;
	x: number;
	y: number;
	delayMs: number;
	dispose: 0 | 1 | 2;
	blend: 0 | 1;
	fromImageData: boolean;
	parts: Uint8Array[];
};

const invalid = () => new DecodeError('invalid');

function readU32(bytes: Uint8Array, pos: number): number {
	if (pos < 0 || pos + 4 > bytes.length) throw invalid();
	return (
		(((bytes[pos] as number) << 24) |
			((bytes[pos + 1] as number) << 16) |
			((bytes[pos + 2] as number) << 8) |
			(bytes[pos + 3] as number)) >>>
		0
	);
}

function readU16(bytes: Uint8Array, pos: number): number {
	if (pos < 0 || pos + 2 > bytes.length) throw invalid();
	return ((bytes[pos] as number) << 8) | (bytes[pos + 1] as number);
}

function writeU32(bytes: Uint8Array, pos: number, value: number): void {
	bytes[pos] = (value >>> 24) & 0xff;
	bytes[pos + 1] = (value >>> 16) & 0xff;
	bytes[pos + 2] = (value >>> 8) & 0xff;
	bytes[pos + 3] = value & 0xff;
}

function writeChunk(out: Uint8Array, pos: number, type: string, data: Uint8Array): number {
	writeU32(out, pos, data.length);
	for (let i = 0; i < 4; i++) out[pos + 4 + i] = type.charCodeAt(i);
	out.set(data, pos + 8);
	writeU32(out, pos + 8 + data.length, crc32(out.subarray(pos + 4, pos + 8 + data.length)));
	return pos + 12 + data.length;
}

function frameDelayMs(numerator: number, denominator: number): number {
	const delayMs = Math.round((1000 * numerator) / (denominator === 0 ? 100 : denominator));
	return delayMs < MIN_DELAY_MS ? FALLBACK_DELAY_MS : delayMs;
}

function buildStandalonePng(header: Uint8Array, ancillary: Uint8Array[], frame: PendingFrame): Uint8Array {
	const parts = frame.parts.filter((part) => part.length > 0);
	if (parts.length === 0) throw invalid();
	let total = SIGNATURE.length + 12 + IHDR_LENGTH + 12;
	for (const chunk of ancillary) total += chunk.length;
	for (const part of parts) total += 12 + part.length;

	const out = new Uint8Array(total);
	out.set(SIGNATURE, 0);
	const frameHeader = header.slice();
	writeU32(frameHeader, 0, frame.width);
	writeU32(frameHeader, 4, frame.height);
	let pos = writeChunk(out, SIGNATURE.length, 'IHDR', frameHeader);
	for (const chunk of ancillary) {
		out.set(chunk, pos);
		pos += chunk.length;
	}
	for (const part of parts) pos = writeChunk(out, pos, 'IDAT', part);
	writeChunk(out, pos, 'IEND', new Uint8Array(0));
	return out;
}

export function splitApng(bytes: Uint8Array): SplitApng {
	if (bytes.length < SIGNATURE.length || SIGNATURE.some((value, index) => bytes[index] !== value)) {
		throw invalid();
	}

	let pos = SIGNATURE.length;
	let header: Uint8Array | null = null;
	let width = 0;
	let height = 0;
	let animation: { frameCount: number; playCount: number } | null = null;
	let sawImageData = false;
	let ended = false;
	let current: PendingFrame | null = null;
	const ancillary: Uint8Array[] = [];
	const pending: PendingFrame[] = [];

	while (pos < bytes.length && !ended) {
		const length = readU32(bytes, pos);
		if (length > MAX_CHUNK_LENGTH) throw invalid();
		const dataStart = pos + 8;
		const dataEnd = dataStart + length;
		const chunkEnd = dataEnd + 4;
		if (chunkEnd > bytes.length) throw invalid();
		if (crc32(bytes.subarray(pos + 4, dataEnd)) !== readU32(bytes, dataEnd)) throw invalid();
		const type = String.fromCharCode(...bytes.subarray(pos + 4, dataStart));
		const data = bytes.subarray(dataStart, dataEnd);
		const raw = bytes.subarray(pos, chunkEnd);
		pos = chunkEnd;

		if (header === null && type !== 'IHDR') throw invalid();

		if (type === 'IHDR') {
			if (header !== null || length !== IHDR_LENGTH) throw invalid();
			header = data;
			width = readU32(data, 0);
			height = readU32(data, 4);
			if (width === 0 || height === 0 || width > MAX_CHUNK_LENGTH || height > MAX_CHUNK_LENGTH) {
				throw invalid();
			}
		} else if (type === 'acTL') {
			if (length !== 8 || animation !== null || sawImageData) throw invalid();
			animation = { frameCount: readU32(data, 0), playCount: readU32(data, 4) };
		} else if (type === 'fcTL') {
			if (!animation || length !== FCTL_LENGTH) throw invalid();
			const frameWidth = readU32(data, 4);
			const frameHeight = readU32(data, 8);
			const x = readU32(data, 12);
			const y = readU32(data, 16);
			const dispose = data[24] as number;
			const blend = data[25] as number;
			if (frameWidth === 0 || frameHeight === 0) throw invalid();
			if (x + frameWidth > width || y + frameHeight > height) throw invalid();
			if (dispose > 2 || blend > 1) throw invalid();
			current = {
				width: frameWidth,
				height: frameHeight,
				x,
				y,
				delayMs: frameDelayMs(readU16(data, 20), readU16(data, 22)),
				dispose: dispose as 0 | 1 | 2,
				blend: blend as 0 | 1,
				fromImageData: !sawImageData,
				parts: []
			};
			pending.push(current);
		} else if (type === 'IDAT') {
			if (!animation) throw new DecodeError('not-animated');
			sawImageData = true;
			if (current?.fromImageData) current.parts.push(data);
		} else if (type === 'fdAT') {
			if (!current || length < 4) throw invalid();
			current.parts.push(data.subarray(4));
		} else if (type === 'IEND') {
			ended = true;
		} else if (!sawImageData && COPIED_TYPES.has(type)) {
			ancillary.push(raw);
		}
	}

	if (!ended || header === null) throw invalid();
	if (!animation) throw new DecodeError('not-animated');
	if (pending.length === 0 || pending.length !== animation.frameCount) throw invalid();

	return {
		width,
		height,
		loopCount: animation.playCount,
		frames: pending.map((frame) => ({
			png: buildStandalonePng(header, ancillary, frame),
			x: frame.x,
			y: frame.y,
			width: frame.width,
			height: frame.height,
			delayMs: frame.delayMs,
			dispose: frame.dispose,
			blend: frame.blend
		}))
	};
}
