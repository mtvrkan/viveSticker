import { resolve } from '$app/paths';
import type { Locale } from '#lib/i18n/index.svelte.ts';
import { CONTENT_PAGES, type PageId } from './site.ts';

const langParam = (locale: Locale) => (locale === 'en' ? 'en' : undefined);

/** In-app href for a page in a locale, including the deploy base. Mirrors `pagePath`. */
export function pageHref(id: PageId, locale: Locale): string {
	const lang = langParam(locale);
	if (id === 'home') {
		const href = resolve('/[[lang=lang]]', { lang });
		return href.endsWith('/') ? href : `${href}/`;
	}
	if (id === 'library') return resolve('/[[lang=lang]]/pack', { lang });
	return resolve('/[[lang=lang]]/[slug=page]', { lang, slug: CONTENT_PAGES[id][locale] });
}
