import { describe, expect, it } from 'vitest';
import { packEntries, packFileName, packProblems } from './pack.ts';

const still = (count: number, bytes = 50_000) =>
	Array.from({ length: count }, () => ({ kind: 'static' as const, bytes }));

describe('packProblems', () => {
	it('accepts a named pack of three static stickers', () => {
		expect(packProblems({ name: 'Kedi', publisher: 'Ben', stickers: still(3) })).toEqual([]);
	});

	it('rejects fewer than three and more than thirty stickers', () => {
		expect(packProblems({ name: 'A', publisher: 'B', stickers: still(2) })).toEqual(['too-few']);
		expect(packProblems({ name: 'A', publisher: 'B', stickers: still(31) })).toEqual(['too-many']);
	});

	it('rejects blank text, mixed kinds and oversized stickers', () => {
		const stickers = [...still(2), { kind: 'animated' as const, bytes: 600 * 1024 }];

		const problems = packProblems({ name: '  ', publisher: 'x'.repeat(129), stickers });

		expect(problems).toEqual(['name-missing', 'publisher-too-long', 'mixed-kinds', 'sticker-too-large']);
	});
});

describe('packFileName', () => {
	it('keeps letters and replaces spaces', () => {
		expect(packFileName(' Komik Kediler! ')).toBe('Komik-Kediler.wastickers');
	});

	it('falls back when nothing usable remains', () => {
		expect(packFileName('///')).toBe('sticker-pack.wastickers');
	});
});

describe('packEntries', () => {
	it('lists title, author, tray and numbered stickers', () => {
		const bytes = new Uint8Array([1]);

		const entries = packEntries(' Kedi ', 'Ben', bytes, [bytes, bytes, bytes]);

		expect(entries.map((entry) => entry.name)).toEqual([
			'title.txt',
			'author.txt',
			'tray.png',
			'01.webp',
			'02.webp',
			'03.webp'
		]);
		expect(new TextDecoder().decode(entries[0]!.data)).toBe('Kedi');
	});
});
