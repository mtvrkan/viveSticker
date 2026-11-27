import type { Faq } from '#lib/content/index.ts';
import type { Locale } from '#lib/i18n/index.svelte.ts';
import { absoluteUrl, pagePath, SITE_NAME, SITE_URL } from './site.ts';

export type JsonLd = Record<string, unknown>;

const context = 'https://schema.org';

export function websiteLd(locale: Locale, description: string): JsonLd {
	return {
		'@context': context,
		'@type': 'WebSite',
		'@id': `${SITE_URL}/#website`,
		name: SITE_NAME,
		url: absoluteUrl(pagePath('home', locale)),
		inLanguage: locale,
		description
	};
}

export function webApplicationLd(locale: Locale, name: string, description: string, path: string): JsonLd {
	return {
		'@context': context,
		'@type': 'WebApplication',
		name,
		url: absoluteUrl(path),
		description,
		inLanguage: locale,
		applicationCategory: 'MultimediaApplication',
		operatingSystem: 'Any',
		browserRequirements: 'Requires JavaScript and a modern browser.',
		isAccessibleForFree: true,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
		isPartOf: { '@id': `${SITE_URL}/#website` }
	};
}

export function breadcrumbLd(items: { name: string; path: string }[]): JsonLd {
	return {
		'@context': context,
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.path)
		}))
	};
}

export function faqLd(faq: Faq[]): JsonLd | null {
	if (faq.length === 0) return null;
	return {
		'@context': context,
		'@type': 'FAQPage',
		mainEntity: faq.map((entry) => ({
			'@type': 'Question',
			name: entry.q,
			acceptedAnswer: { '@type': 'Answer', text: entry.a }
		}))
	};
}

/**
 * Serialises structured data for a `<script type="application/ld+json">` body. `<` is escaped so no
 * string inside the data can close the script element, whatever the content says.
 */
export function serializeLd(data: JsonLd): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
