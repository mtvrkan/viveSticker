import { DecodeError } from './errors.ts';

export type WebpAnimFrame = {
	webp: Uint8Array;
	x: number;
	y: number;
	width: number;
	height: number;
	durationMs: number;
	blend: boolean;
	dispose: boolean;
};
export type SplitWebp = {
	width: number;
	height: number;
	loopCount: number;
	background: number;
	frames: WebpAnimFrame[];
};

const MIN_DURATION_MS = 10;
const FALLBACK_DURATION_MS = 100;
const ANIMATION_FLAG = 0x02;
const ALPHA_FLAG = 0x10;
const ANMF_HEADER_LENGTH = 16;
const VP8X_LENGTH = 10;

type Chunk = { type: string; payload: Uint8Array };
type PendingFrame = {
	x: number;
	y: number;
	width: number;
	height: number;
	durationMs: number;
	blend: boolean;
	dispose: boolean;
	image: Chunk;
	alpha: Uint8Array | null;
};

const invalid = () => new DecodeError('invalid');

function byteAt(bytes: Uint8Array, pos: number): number {
	const value = bytes[pos];
	if (value === undefined) throw invalid();
	return value;
}

function readU24(bytes: Uint8Array, pos: number): number {
	return byteAt(bytes, pos) | (byteAt(bytes, pos + 1) << 8) | (byteAt(bytes, pos + 2) << 16);
}

function readU32(bytes: Uint8Array, pos: number): number {
	return (readU24(bytes, pos) | (byteAt(bytes, pos + 3) << 24)) >>> 0;
}

function readTag(bytes: Uint8Array, pos: number): string {
	if (pos + 4 > bytes.length) throw invalid();
	return String.fromCharCode(...bytes.subarray(pos, pos + 4));
}

function writeU24(bytes: Uint8Array, pos: number, value: number): void {
	bytes[pos] = value & 0xff;
	bytes[pos + 1] = (value >>> 8) & 0xff;
	bytes[pos + 2] = (value >>> 16) & 0xff;
}

function writeU32(bytes: Uint8Array, pos: number, value: number): void {
	writeU24(bytes, pos, value);
	bytes[pos + 3] = (value >>> 24) & 0xff;
}

function writeTag(bytes: Uint8Array, pos: number, tag: string): void {
	for (let i = 0; i < 4; i++) bytes[pos + i] = tag.charCodeAt(i);
}

function* iterateChunks(bytes: Uint8Array, start: number, end: number): Generator<Chunk> {
	let pos = start;
	while (pos + 8 <= end) {
		const type = readTag(bytes, pos);
		const size = readU32(bytes, pos + 4);
		const payloadStart = pos + 8;
		const payloadEnd = payloadStart + size;
		if (payloadEnd > end) throw invalid();
		yield { type, payload: bytes.subarray(payloadStart, payloadEnd) };
		pos = payloadEnd + (size & 1);
	}
}

function parseFrame(payload: Uint8Array): PendingFrame {
	if (payload.length < ANMF_HEADER_LENGTH) throw invalid();
	const flags = byteAt(payload, 15);
	const durationMs = readU24(payload, 12);
	let image: Chunk | null = null;
	let alpha: Uint8Array | null = null;
	for (const chunk of iterateChunks(payload, ANMF_HEADER_LENGTH, payload.length)) {
		if (chunk.type === 'ALPH') alpha ??= chunk.payload;
		else if (chunk.type === 'VP8 ' || chunk.type === 'VP8L') image ??= chunk;
	}
	if (!image) throw invalid();
	return {
		x: readU24(payload, 0) * 2,
		y: readU24(payload, 3) * 2,
		width: readU24(payload, 6) + 1,
		height: readU24(payload, 9) + 1,
		durationMs: durationMs < MIN_DURATION_MS ? FALLBACK_DURATION_MS : durationMs,
		blend: (flags & 0x02) === 0,
		dispose: (flags & 0x01) !== 0,
		image,
		alpha
	};
}

function buildStillWebp(frame: PendingFrame): Uint8Array {
	const chunks: Chunk[] = [];
	if (frame.alpha && frame.image.type === 'VP8 ') {
		const extended = new Uint8Array(VP8X_LENGTH);
		extended[0] = ALPHA_FLAG;
		writeU24(extended, 4, frame.width - 1);
		writeU24(extended, 7, frame.height - 1);
		chunks.push({ type: 'VP8X', payload: extended }, { type: 'ALPH', payload: frame.alpha }, frame.image);
	} else {
		chunks.push(frame.image);
	}

	let total = 12;
	for (const chunk of chunks) total += 8 + chunk.payload.length + (chunk.payload.length & 1);
	const out = new Uint8Array(total);
	writeTag(out, 0, 'RIFF');
	writeU32(out, 4, total - 8);
	writeTag(out, 8, 'WEBP');
	let pos = 12;
	for (const chunk of chunks) {
		writeTag(out, pos, chunk.type);
		writeU32(out, pos + 4, chunk.payload.length);
		out.set(chunk.payload, pos + 8);
		pos += 8 + chunk.payload.length + (chunk.payload.length & 1);
	}
	return out;
}

export function splitAnimatedWebp(bytes: Uint8Array): SplitWebp {
	if (bytes.length < 12 || readTag(bytes, 0) !== 'RIFF' || readTag(bytes, 8) !== 'WEBP') throw invalid();
	const riffSize = readU32(bytes, 4);
	const end = riffSize + 8;
	if (riffSize < 4 || end > bytes.length) throw invalid();

	let canvas: { width: number; height: number; animated: boolean } | null = null;
	let loopCount = 0;
	let background = 0;
	const pending: PendingFrame[] = [];

	for (const chunk of iterateChunks(bytes, 12, end)) {
		if (chunk.type === 'VP8X') {
			if (chunk.payload.length < VP8X_LENGTH) throw invalid();
			canvas = {
				width: readU24(chunk.payload, 4) + 1,
				height: readU24(chunk.payload, 7) + 1,
				animated: (byteAt(chunk.payload, 0) & ANIMATION_FLAG) !== 0
			};
		} else if (chunk.type === 'ANIM') {
			if (chunk.payload.length < 6) throw invalid();
			background = readU32(chunk.payload, 0);
			loopCount = byteAt(chunk.payload, 4) | (byteAt(chunk.payload, 5) << 8);
		} else if (chunk.type === 'ANMF') {
			pending.push(parseFrame(chunk.payload));
		}
	}

	if (!canvas || !canvas.animated || pending.length === 0) throw new DecodeError('not-animated');
	for (const frame of pending) {
		if (frame.x + frame.width > canvas.width || frame.y + frame.height > canvas.height) throw invalid();
	}

	return {
		width: canvas.width,
		height: canvas.height,
		loopCount,
		background,
		frames: pending.map((frame) => ({
			webp: buildStillWebp(frame),
			x: frame.x,
			y: frame.y,
			width: frame.width,
			height: frame.height,
			durationMs: frame.durationMs,
			blend: frame.blend,
			dispose: frame.dispose
		}))
	};
}
