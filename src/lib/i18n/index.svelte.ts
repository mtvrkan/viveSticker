import { en } from './en.ts';
import { tr, type MessageKey } from './tr.ts';

export type Locale = 'tr' | 'en';

const catalogs: Record<Locale, Record<MessageKey, string>> = { tr, en };
const storageKey = 'vivesticker.locale';

export const i18n = $state<{ locale: Locale }>({ locale: 'tr' });

export function t(key: MessageKey): string {
	return catalogs[i18n.locale][key];
}

export function setLocale(locale: Locale): void {
	i18n.locale = locale;
	document.documentElement.lang = locale;
	try {
		localStorage.setItem(storageKey, locale);
	} catch {
		return;
	}
}

export function detectLocale(): Locale {
	try {
		const saved = localStorage.getItem(storageKey);
		if (saved === 'tr' || saved === 'en') return saved;
	} catch {
		return 'tr';
	}
	return navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en';
}
