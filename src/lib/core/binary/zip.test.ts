import { describe, expect, it } from 'vitest';
import { crc32 } from './crc32.ts';
import { createZip } from './zip.ts';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

function view(bytes: Uint8Array): DataView {
	return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

describe('createZip', () => {
	it('writes the end record with the entry count and central directory location', () => {
		const zip = createZip([
			{ name: 'a.bin', data: new Uint8Array([1, 2, 3]) },
			{ name: 'b.bin', data: new Uint8Array([4, 5]) }
		]);
		const v = view(zip);
		const end = zip.length - 22;

		expect(v.getUint32(end, true)).toBe(0x06054b50);
		expect(v.getUint16(end + 8, true)).toBe(2);
		expect(v.getUint16(end + 10, true)).toBe(2);
		expect(v.getUint32(end + 12, true)).toBe(end - v.getUint32(end + 16, true));
		expect(v.getUint32(v.getUint32(end + 16, true), true)).toBe(0x02014b50);
	});

	it('stores data verbatim at the offset given by the central directory', () => {
		const first = new Uint8Array([9, 8, 7, 6]);
		const second = encoder.encode('hello world');
		const zip = createZip([
			{ name: 'one', data: first },
			{ name: 'two', data: second }
		]);
		const v = view(zip);
		const end = zip.length - 22;
		const centralOffset = v.getUint32(end + 16, true);
		const secondEntryOffset = v.getUint32(centralOffset + 46 + 3 + 42, true);

		expect(v.getUint32(secondEntryOffset, true)).toBe(0x04034b50);
		const nameLength = v.getUint16(secondEntryOffset + 26, true);
		const size = v.getUint32(secondEntryOffset + 18, true);
		const start = secondEntryOffset + 30 + nameLength;
		expect(zip.subarray(start, start + size)).toEqual(second);
		expect(zip.subarray(30 + 3, 30 + 3 + first.length)).toEqual(first);
	});

	it('records crc and sizes in both headers with the STORE method', () => {
		const data = encoder.encode('123456789');
		const zip = createZip([{ name: 'check.txt', data }]);
		const v = view(zip);
		const centralOffset = v.getUint32(zip.length - 22 + 16, true);

		expect(v.getUint16(8, true)).toBe(0);
		expect(v.getUint32(14, true)).toBe(0xcbf43926);
		expect(v.getUint32(14, true)).toBe(crc32(data));
		expect(v.getUint32(18, true)).toBe(9);
		expect(v.getUint32(22, true)).toBe(9);
		expect(v.getUint16(centralOffset + 10, true)).toBe(0);
		expect(v.getUint32(centralOffset + 16, true)).toBe(0xcbf43926);
		expect(v.getUint32(centralOffset + 20, true)).toBe(9);
		expect(v.getUint32(centralOffset + 24, true)).toBe(9);
		expect(v.getUint32(centralOffset + 42, true)).toBe(0);
	});

	it('encodes utf-8 names and sets the language encoding flag', () => {
		const name = 'çıkartma.webp';
		const nameBytes = encoder.encode(name);
		const zip = createZip([{ name, data: new Uint8Array([1]) }]);
		const v = view(zip);

		expect(v.getUint16(6, true) & 0x0800).toBe(0x0800);
		expect(v.getUint16(26, true)).toBe(nameBytes.length);
		expect(decoder.decode(zip.subarray(30, 30 + nameBytes.length))).toBe(name);
		const centralOffset = v.getUint32(zip.length - 22 + 16, true);
		expect(v.getUint16(centralOffset + 8, true) & 0x0800).toBe(0x0800);
		expect(decoder.decode(zip.subarray(centralOffset + 46, centralOffset + 46 + nameBytes.length))).toBe(
			name
		);
	});

	it('encodes the modified date as DOS date and time', () => {
		const zip = createZip([
			{ name: 'a', data: new Uint8Array(), modified: new Date(2025, 5, 15, 13, 45, 30) }
		]);
		const v = view(zip);

		expect(v.getUint16(10, true)).toBe((13 << 11) | (45 << 5) | 15);
		expect(v.getUint16(12, true)).toBe(((2025 - 1980) << 9) | (6 << 5) | 15);
	});

	it('defaults the modified date to 2026-01-01', () => {
		const zip = createZip([{ name: 'a', data: new Uint8Array() }]);
		const v = view(zip);

		expect(v.getUint16(10, true)).toBe(0);
		expect(v.getUint16(12, true)).toBe(((2026 - 1980) << 9) | (1 << 5) | 1);
	});

	it('handles an empty entry list', () => {
		const zip = createZip([]);
		const v = view(zip);

		expect(zip.length).toBe(22);
		expect(v.getUint32(0, true)).toBe(0x06054b50);
		expect(v.getUint16(8, true)).toBe(0);
		expect(v.getUint32(12, true)).toBe(0);
		expect(v.getUint32(16, true)).toBe(0);
	});

	it('handles an entry with empty data', () => {
		const zip = createZip([{ name: 'empty', data: new Uint8Array() }]);
		const v = view(zip);

		expect(v.getUint32(14, true)).toBe(0);
		expect(v.getUint32(18, true)).toBe(0);
		expect(zip.length).toBe(30 + 5 + 46 + 5 + 22);
	});

	it('rejects duplicate names', () => {
		expect(() =>
			createZip([
				{ name: 'same.webp', data: new Uint8Array([1]) },
				{ name: 'same.webp', data: new Uint8Array([2]) }
			])
		).toThrow('zip-duplicate-name');
	});

	it('rejects more than 65535 entries', () => {
		const entries = Array.from({ length: 0x10000 }, (_, index) => ({
			name: String(index),
			data: new Uint8Array()
		}));

		expect(() => createZip(entries)).toThrow('zip-too-large');
	});
});
