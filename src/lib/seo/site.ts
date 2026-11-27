import type { Locale } from '#lib/i18n/locale.ts';

/** Production origin. Canonical, hreflang, sitemap and Open Graph URLs are built from it. */
export const SITE_URL = 'https://sticker.vivepdf.com';
export const SITE_NAME = 'viveSticker';
export const LOCALES: readonly Locale[] = ['tr', 'en'];
export const DEFAULT_LOCALE: Locale = 'tr';
/** Each language named in itself, for the switch and hreflang links. */
export const LANGUAGE_NAMES: Record<Locale, string> = { tr: 'Türkçe', en: 'English' };
export const OG_LOCALE: Record<Locale, string> = { tr: 'tr_TR', en: 'en_US' };
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** Pages that exist in every locale. `slug` is the URL segment after the optional `/en`. */
export const CONTENT_PAGES = {
	gif: { tr: 'gif-ten-cikartma', en: 'gif-to-sticker' },
	video: { tr: 'videodan-cikartma', en: 'video-to-sticker' },
	photo: { tr: 'fotograftan-cikartma', en: 'photo-to-sticker' },
	cutout: { tr: 'arka-plan-silme', en: 'remove-background' },
	animated: { tr: 'hareketli-cikartma', en: 'animated-sticker' },
	pack: { tr: 'cikartma-paketi', en: 'sticker-pack' },
	guide: { tr: 'whatsapp-cikartma-ekleme', en: 'add-stickers-to-whatsapp' },
	limits: { tr: 'whatsapp-cikartma-boyutlari', en: 'whatsapp-sticker-size' },
	faq: { tr: 'sss', en: 'faq' },
	privacy: { tr: 'gizlilik', en: 'privacy' }
} as const satisfies Record<string, Record<Locale, string>>;

export type ContentId = keyof typeof CONTENT_PAGES;
export type PageId = 'home' | 'library' | ContentId;

export const CONTENT_IDS = Object.keys(CONTENT_PAGES) as ContentId[];
export const PAGE_IDS: readonly PageId[] = ['home', 'library', ...CONTENT_IDS];

export function isLocale(value: unknown): value is Locale {
	return value === 'tr' || value === 'en';
}

export function localeFromParam(lang: string | undefined): Locale {
	return lang === 'en' ? 'en' : DEFAULT_LOCALE;
}

/** Finds the content page a slug belongs to in the given locale; `null` when it is not ours. */
export function contentBySlug(slug: string, locale: Locale): ContentId | null {
	return CONTENT_IDS.find((id) => CONTENT_PAGES[id][locale] === slug) ?? null;
}

export type ContentSlug = (typeof CONTENT_PAGES)[ContentId][Locale];

export function isContentSlug(slug: string): slug is ContentSlug {
	return LOCALES.some((locale) => contentBySlug(slug, locale) !== null);
}

/**
 * Root-relative path of a page, without the deploy base. Locale homes end in a slash (`/`, `/en/`)
 * so `/en/` prerenders to `en/index.html` and never collides with the `en/` folder on static hosts.
 */
export function pagePath(id: PageId, locale: Locale): string {
	const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
	if (id === 'home') return `${prefix}/`;
	if (id === 'library') return `${prefix}/pack`;
	return `${prefix}/${CONTENT_PAGES[id][locale]}`;
}

export function absoluteUrl(path: string): string {
	return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

/** Which page a route renders, from SvelteKit's route id and params; `null` for unknown routes. */
export function pageIdFrom(
	routeId: string | null,
	params: Record<string, string | undefined>
): PageId | null {
	const locale = localeFromParam(params.lang);
	if (routeId === '/[[lang=lang]]') return 'home';
	if (routeId === '/[[lang=lang]]/pack') return 'library';
	if (routeId === '/[[lang=lang]]/[slug=page]' && params.slug) return contentBySlug(params.slug, locale);
	return null;
}
