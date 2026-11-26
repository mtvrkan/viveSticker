import { describe, expect, it } from 'vitest';
import { PACK_MAX_STICKERS } from '#lib/core/whatsapp.ts';
import { readSelection, selectionQuery } from './selection.ts';

describe('pack selection query', () => {
	it('round-trips ids in order', () => {
		const ids = ['b-2', 'a-1', 'c-3'];
		expect(readSelection(selectionQuery(ids))).toEqual(ids);
	});

	it('returns nothing when the parameter is missing or empty', () => {
		expect(readSelection('')).toEqual([]);
		expect(readSelection('?select=')).toEqual([]);
		expect(readSelection('?other=1')).toEqual([]);
	});

	it('drops blanks and duplicates and caps the count', () => {
		expect(readSelection('?select=a,,a,%20b%20')).toEqual(['a', 'b']);
		const many = Array.from({ length: PACK_MAX_STICKERS + 5 }, (_, index) => `id-${index}`);
		expect(readSelection(`?select=${many.join(',')}`)).toHaveLength(PACK_MAX_STICKERS);
	});
});
