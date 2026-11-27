import { absoluteUrl, LOCALES, pagePath, PAGE_IDS, DEFAULT_LOCALE } from '#lib/seo/site.ts';

export const prerender = true;

function entry(id: (typeof PAGE_IDS)[number]): string {
	const alternates = [
		...LOCALES.map(
			(locale) =>
				`<xhtml:link rel="alternate" hreflang="${locale}" href="${absoluteUrl(pagePath(id, locale))}"/>`
		),
		`<xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(pagePath(id, DEFAULT_LOCALE))}"/>`
	].join('');
	return LOCALES.map(
		(locale) => `<url><loc>${absoluteUrl(pagePath(id, locale))}</loc>${alternates}</url>`
	).join('');
}

export function GET(): Response {
	const body =
		'<?xml version="1.0" encoding="UTF-8"?>' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
		PAGE_IDS.map(entry).join('') +
		'</urlset>';
	return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
