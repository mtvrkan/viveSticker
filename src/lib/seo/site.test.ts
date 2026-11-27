import { describe, expect, it } from 'vitest';
import {
	absoluteUrl,
	CONTENT_IDS,
	CONTENT_PAGES,
	contentBySlug,
	isContentSlug,
	localeFromParam,
	pageIdFrom,
	pagePath,
	PAGE_IDS
} from './site.ts';

describe('pagePath', () => {
	it('puts Turkish at the root and English under /en', () => {
		expect(pagePath('home', 'tr')).toBe('/');
		expect(pagePath('home', 'en')).toBe('/en/');
		expect(pagePath('library', 'tr')).toBe('/pack');
		expect(pagePath('library', 'en')).toBe('/en/pack');
		expect(pagePath('gif', 'tr')).toBe('/gif-ten-cikartma');
		expect(pagePath('gif', 'en')).toBe('/en/gif-to-sticker');
	});

	it('gives every page a unique path per locale', () => {
		const paths = PAGE_IDS.flatMap((id) => [pagePath(id, 'tr'), pagePath(id, 'en')]);
		expect(new Set(paths).size).toBe(paths.length);
	});
});

describe('content slugs', () => {
	it('maps a slug back to its page only in its own locale', () => {
		expect(contentBySlug('sss', 'tr')).toBe('faq');
		expect(contentBySlug('faq', 'en')).toBe('faq');
		expect(contentBySlug('faq', 'tr')).toBeNull();
	});

	it('never claims reserved segments', () => {
		for (const reserved of ['en', 'pack', 'sitemap.xml', 'robots.txt', 'share-target', ''])
			expect(isContentSlug(reserved)).toBe(false);
	});

	it('keeps slugs URL-safe ASCII', () => {
		for (const id of CONTENT_IDS)
			for (const slug of Object.values(CONTENT_PAGES[id])) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});
});

describe('locale and URL helpers', () => {
	it('falls back to Turkish for any unknown prefix', () => {
		expect(localeFromParam(undefined)).toBe('tr');
		expect(localeFromParam('en')).toBe('en');
		expect(localeFromParam('de')).toBe('tr');
	});

	it('builds absolute URLs on the production origin', () => {
		expect(absoluteUrl('/')).toBe('https://sticker.vivepdf.com/');
		expect(absoluteUrl('/en/faq')).toBe('https://sticker.vivepdf.com/en/faq');
	});
});

describe('pageIdFrom', () => {
	it('maps each route to its page in either locale', () => {
		expect(pageIdFrom('/[[lang=lang]]', {})).toBe('home');
		expect(pageIdFrom('/[[lang=lang]]', { lang: 'en' })).toBe('home');
		expect(pageIdFrom('/[[lang=lang]]/pack', { lang: 'en' })).toBe('library');
		expect(pageIdFrom('/[[lang=lang]]/[slug=page]', { slug: 'sss' })).toBe('faq');
		expect(pageIdFrom('/[[lang=lang]]/[slug=page]', { lang: 'en', slug: 'faq' })).toBe('faq');
	});

	it('rejects slugs from the other locale and unknown routes', () => {
		expect(pageIdFrom('/[[lang=lang]]/[slug=page]', { slug: 'faq' })).toBeNull();
		expect(pageIdFrom('/[[lang=lang]]/[slug=page]', {})).toBeNull();
		expect(pageIdFrom(null, {})).toBeNull();
		expect(pageIdFrom('/sitemap.xml', {})).toBeNull();
	});
});
