export type StillWebp = { payload: Uint8Array; width: number; height: number; hasAlpha: boolean };
export type MuxFrame = {
	webp: Uint8Array;
	durationMs: number;
	x?: number;
	y?: number;
	blend?: boolean;
	dispose?: boolean;
};
export type MuxOptions = { width: number; height: number; loopCount?: number; background?: number };

const RIFF_HEADER_SIZE = 12;
const CHUNK_HEADER_SIZE = 8;
const VP8X_SIZE = 10;
const ANIM_SIZE = 6;
const ANMF_HEADER_SIZE = 16;
const MAX_UINT32 = 0xffffffff;
const MAX_UINT24 = 0xffffff;
const MAX_CANVAS = 0x1000000;

function invalid(): Error {
	return new Error('webp-invalid');
}

function viewOf(bytes: Uint8Array): DataView {
	return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function readTag(view: DataView, offset: number): string {
	return String.fromCharCode(
		view.getUint8(offset),
		view.getUint8(offset + 1),
		view.getUint8(offset + 2),
		view.getUint8(offset + 3)
	);
}

function readUint24(bytes: Uint8Array, offset: number): number {
	return (
		(bytes[offset] as number) | ((bytes[offset + 1] as number) << 8) | ((bytes[offset + 2] as number) << 16)
	);
}

function writeUint24(view: DataView, offset: number, value: number): void {
	view.setUint8(offset, value & 0xff);
	view.setUint8(offset + 1, (value >>> 8) & 0xff);
	view.setUint8(offset + 2, (value >>> 16) & 0xff);
}

function writeTag(view: DataView, offset: number, tag: string): void {
	for (let i = 0; i < 4; i++) view.setUint8(offset + i, tag.charCodeAt(i));
}

function readLossyHeader(data: Uint8Array): { width: number; height: number } {
	if (data.length < 10) throw invalid();
	if (((data[0] as number) & 1) !== 0) throw invalid();
	if (data[3] !== 0x9d || data[4] !== 0x01 || data[5] !== 0x2a) throw invalid();
	const view = viewOf(data);
	const width = view.getUint16(6, true) & 0x3fff;
	const height = view.getUint16(8, true) & 0x3fff;
	if (width === 0 || height === 0) throw invalid();
	return { width, height };
}

function readLosslessHeader(data: Uint8Array): { width: number; height: number; hasAlpha: boolean } {
	if (data.length < 5 || data[0] !== 0x2f) throw invalid();
	const bits = viewOf(data).getUint32(1, true);
	if (bits >>> 29 !== 0) throw invalid();
	return {
		width: (bits & 0x3fff) + 1,
		height: ((bits >>> 14) & 0x3fff) + 1,
		hasAlpha: ((bits >>> 28) & 1) === 1
	};
}

function concat(first: Uint8Array, second: Uint8Array): Uint8Array {
	const out = new Uint8Array(first.length + second.length);
	out.set(first, 0);
	out.set(second, first.length);
	return out;
}

export function readStillWebp(webp: Uint8Array): StillWebp {
	if (webp.length < RIFF_HEADER_SIZE) throw invalid();
	const view = viewOf(webp);
	if (readTag(view, 0) !== 'RIFF' || readTag(view, 8) !== 'WEBP') throw invalid();
	const end = view.getUint32(4, true) + CHUNK_HEADER_SIZE;
	if (end < RIFF_HEADER_SIZE || end > webp.length) throw invalid();

	let canvas: { width: number; height: number } | undefined;
	let alphaChunk: Uint8Array | undefined;
	let pos = RIFF_HEADER_SIZE;
	while (pos < end) {
		if (pos + CHUNK_HEADER_SIZE > end) throw invalid();
		const id = readTag(view, pos);
		const size = view.getUint32(pos + 4, true);
		const dataStart = pos + CHUNK_HEADER_SIZE;
		const chunkEnd = dataStart + size + (size & 1);
		if (chunkEnd > end) throw invalid();
		const data = webp.subarray(dataStart, dataStart + size);
		const whole = webp.subarray(pos, chunkEnd);

		if (id === 'ANIM' || id === 'ANMF') throw new Error('webp-animated');
		if (pos === RIFF_HEADER_SIZE && id !== 'VP8X' && id !== 'VP8 ' && id !== 'VP8L') throw invalid();

		if (id === 'VP8X') {
			if (pos !== RIFF_HEADER_SIZE || size < VP8X_SIZE) throw invalid();
			if (((data[0] as number) & 0x02) !== 0) throw new Error('webp-animated');
			canvas = { width: readUint24(data, 4) + 1, height: readUint24(data, 7) + 1 };
		} else if (id === 'ALPH') {
			if (alphaChunk) throw invalid();
			alphaChunk = whole;
		} else if (id === 'VP8 ') {
			const header = readLossyHeader(data);
			return {
				payload: alphaChunk ? concat(alphaChunk, whole) : whole.slice(),
				width: canvas?.width ?? header.width,
				height: canvas?.height ?? header.height,
				hasAlpha: alphaChunk !== undefined
			};
		} else if (id === 'VP8L') {
			const header = readLosslessHeader(data);
			return {
				payload: whole.slice(),
				width: canvas?.width ?? header.width,
				height: canvas?.height ?? header.height,
				hasAlpha: header.hasAlpha
			};
		}
		pos = chunkEnd;
	}
	throw invalid();
}

function isValidDimension(value: number): boolean {
	return Number.isInteger(value) && value >= 1 && value <= MAX_CANVAS;
}

export function muxAnimatedWebp(frames: MuxFrame[], options: MuxOptions): Uint8Array {
	if (frames.length === 0) throw new Error('webp-no-frames');
	if (!isValidDimension(options.width) || !isValidDimension(options.height)) {
		throw new Error('webp-frame-bounds');
	}

	const parsed = frames.map((frame) => {
		const still = readStillWebp(frame.webp);
		const x = frame.x ?? 0;
		const y = frame.y ?? 0;
		if (!Number.isInteger(x) || !Number.isInteger(y) || x % 2 !== 0 || y % 2 !== 0) {
			throw new Error('webp-odd-offset');
		}
		if (x < 0 || y < 0 || x + still.width > options.width || y + still.height > options.height) {
			throw new Error('webp-frame-bounds');
		}
		const duration = Number.isFinite(frame.durationMs)
			? Math.min(Math.max(Math.round(frame.durationMs), 1), MAX_UINT24)
			: 1;
		const flags = (frame.blend === false ? 0x02 : 0) | (frame.dispose === true ? 0x01 : 0);
		return { still, x, y, duration, flags };
	});

	let riffSize = 4 + CHUNK_HEADER_SIZE + VP8X_SIZE + CHUNK_HEADER_SIZE + ANIM_SIZE;
	for (const item of parsed) riffSize += CHUNK_HEADER_SIZE + ANMF_HEADER_SIZE + item.still.payload.length;
	if (riffSize + CHUNK_HEADER_SIZE > MAX_UINT32) throw new Error('webp-too-large');

	const out = new Uint8Array(riffSize + CHUNK_HEADER_SIZE);
	const view = viewOf(out);
	writeTag(view, 0, 'RIFF');
	view.setUint32(4, riffSize, true);
	writeTag(view, 8, 'WEBP');

	let pos = RIFF_HEADER_SIZE;
	writeTag(view, pos, 'VP8X');
	view.setUint32(pos + 4, VP8X_SIZE, true);
	const hasAlpha = parsed.some((item) => item.still.hasAlpha);
	view.setUint8(pos + 8, 0x02 | (hasAlpha ? 0x10 : 0));
	writeUint24(view, pos + 12, options.width - 1);
	writeUint24(view, pos + 15, options.height - 1);
	pos += CHUNK_HEADER_SIZE + VP8X_SIZE;

	writeTag(view, pos, 'ANIM');
	view.setUint32(pos + 4, ANIM_SIZE, true);
	view.setUint32(pos + 8, (options.background ?? 0) >>> 0, true);
	view.setUint16(pos + 12, (options.loopCount ?? 0) & 0xffff, true);
	pos += CHUNK_HEADER_SIZE + ANIM_SIZE;

	for (const item of parsed) {
		const payload = item.still.payload;
		writeTag(view, pos, 'ANMF');
		view.setUint32(pos + 4, ANMF_HEADER_SIZE + payload.length, true);
		writeUint24(view, pos + 8, item.x / 2);
		writeUint24(view, pos + 11, item.y / 2);
		writeUint24(view, pos + 14, item.still.width - 1);
		writeUint24(view, pos + 17, item.still.height - 1);
		writeUint24(view, pos + 20, item.duration);
		view.setUint8(pos + 23, item.flags);
		out.set(payload, pos + CHUNK_HEADER_SIZE + ANMF_HEADER_SIZE);
		pos += CHUNK_HEADER_SIZE + ANMF_HEADER_SIZE + payload.length;
	}
	return out;
}
