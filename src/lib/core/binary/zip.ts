import { crc32 } from '#lib/core/binary/crc32.ts';

export type ZipEntry = { name: string; data: Uint8Array; modified?: Date };

const MAX_UINT32 = 0xffffffff;
const MAX_UINT16 = 0xffff;
const LOCAL_HEADER_SIZE = 30;
const CENTRAL_HEADER_SIZE = 46;
const END_RECORD_SIZE = 22;
const UTF8_FLAG = 0x0800;
const VERSION = 20;

type PreparedEntry = {
	nameBytes: Uint8Array;
	data: Uint8Array;
	crc: number;
	dosTime: number;
	dosDate: number;
	offset: number;
};

function toDosDateTime(date: Date): { dosTime: number; dosDate: number } {
	const year = Math.min(Math.max(date.getFullYear(), 1980), 2107);
	const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
	const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
	return { dosTime, dosDate };
}

export function createZip(entries: ZipEntry[]): Uint8Array {
	if (entries.length > MAX_UINT16) throw new Error('zip-too-large');
	const encoder = new TextEncoder();
	const seen = new Set<string>();
	const prepared: PreparedEntry[] = [];
	let offset = 0;
	let centralSize = 0;
	for (const entry of entries) {
		if (seen.has(entry.name)) throw new Error('zip-duplicate-name');
		seen.add(entry.name);
		const nameBytes = encoder.encode(entry.name);
		if (nameBytes.length > MAX_UINT16 || entry.data.length > MAX_UINT32 || offset > MAX_UINT32) {
			throw new Error('zip-too-large');
		}
		const { dosTime, dosDate } = toDosDateTime(entry.modified ?? new Date(2026, 0, 1));
		prepared.push({
			nameBytes,
			data: entry.data,
			crc: crc32(entry.data),
			dosTime,
			dosDate,
			offset
		});
		offset += LOCAL_HEADER_SIZE + nameBytes.length + entry.data.length;
		centralSize += CENTRAL_HEADER_SIZE + nameBytes.length;
	}
	const centralOffset = offset;
	const total = centralOffset + centralSize + END_RECORD_SIZE;
	if (offset > MAX_UINT32 || centralSize > MAX_UINT32 || total > MAX_UINT32) throw new Error('zip-too-large');

	const out = new Uint8Array(total);
	const view = new DataView(out.buffer);
	let pos = 0;
	for (const item of prepared) {
		view.setUint32(pos, 0x04034b50, true);
		view.setUint16(pos + 4, VERSION, true);
		view.setUint16(pos + 6, UTF8_FLAG, true);
		view.setUint16(pos + 8, 0, true);
		view.setUint16(pos + 10, item.dosTime, true);
		view.setUint16(pos + 12, item.dosDate, true);
		view.setUint32(pos + 14, item.crc, true);
		view.setUint32(pos + 18, item.data.length, true);
		view.setUint32(pos + 22, item.data.length, true);
		view.setUint16(pos + 26, item.nameBytes.length, true);
		view.setUint16(pos + 28, 0, true);
		out.set(item.nameBytes, pos + LOCAL_HEADER_SIZE);
		out.set(item.data, pos + LOCAL_HEADER_SIZE + item.nameBytes.length);
		pos += LOCAL_HEADER_SIZE + item.nameBytes.length + item.data.length;
	}
	for (const item of prepared) {
		view.setUint32(pos, 0x02014b50, true);
		view.setUint16(pos + 4, VERSION, true);
		view.setUint16(pos + 6, VERSION, true);
		view.setUint16(pos + 8, UTF8_FLAG, true);
		view.setUint16(pos + 10, 0, true);
		view.setUint16(pos + 12, item.dosTime, true);
		view.setUint16(pos + 14, item.dosDate, true);
		view.setUint32(pos + 16, item.crc, true);
		view.setUint32(pos + 20, item.data.length, true);
		view.setUint32(pos + 24, item.data.length, true);
		view.setUint16(pos + 28, item.nameBytes.length, true);
		view.setUint16(pos + 30, 0, true);
		view.setUint16(pos + 32, 0, true);
		view.setUint16(pos + 34, 0, true);
		view.setUint16(pos + 36, 0, true);
		view.setUint32(pos + 38, 0, true);
		view.setUint32(pos + 42, item.offset, true);
		out.set(item.nameBytes, pos + CENTRAL_HEADER_SIZE);
		pos += CENTRAL_HEADER_SIZE + item.nameBytes.length;
	}
	view.setUint32(pos, 0x06054b50, true);
	view.setUint16(pos + 4, 0, true);
	view.setUint16(pos + 6, 0, true);
	view.setUint16(pos + 8, prepared.length, true);
	view.setUint16(pos + 10, prepared.length, true);
	view.setUint32(pos + 12, centralSize, true);
	view.setUint32(pos + 16, centralOffset, true);
	view.setUint16(pos + 20, 0, true);
	return out;
}
