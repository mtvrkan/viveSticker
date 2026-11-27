import { en } from './en.ts';
import { tr, type MessageKey } from './tr.ts';

import type { Locale } from './locale.ts';

export type { Locale };

const catalogs: Record<Locale, Record<MessageKey, string>> = { tr, en };
const storageKey = 'vivesticker.locale';

/**
 * The URL decides the language (`/` is Turkish, `/en` is English) so every page can be
 * prerendered and indexed per locale. The root layout writes this during render.
 */
export const i18n = $state<{ locale: Locale }>({ locale: 'tr' });

export function t(key: MessageKey): string {
	return catalogs[i18n.locale][key];
}

export function setLocale(locale: Locale): void {
	i18n.locale = locale;
	if (typeof document !== 'undefined') document.documentElement.lang = locale;
}

/** Records an explicit choice made with the language switch. */
export function rememberLocale(locale: Locale): void {
	try {
		localStorage.setItem(storageKey, locale);
	} catch {
		return;
	}
}

/** The language the visitor picked earlier, if any. Browser language alone never redirects. */
export function rememberedLocale(): Locale | null {
	try {
		const saved = localStorage.getItem(storageKey);
		return saved === 'tr' || saved === 'en' ? saved : null;
	} catch {
		return null;
	}
}
