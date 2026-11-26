import { describe, expect, it } from 'vitest';
import { crc32 } from './crc32.ts';

describe('crc32', () => {
	it('matches the standard check value', () => {
		expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
	});

	it('supports incremental updates and empty input', () => {
		const bytes = new TextEncoder().encode('123456789');
		expect(crc32(bytes.subarray(4), crc32(bytes.subarray(0, 4)))).toBe(0xcbf43926);
		expect(crc32(new Uint8Array())).toBe(0);
	});
});
