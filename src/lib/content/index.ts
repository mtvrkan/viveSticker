import type { Locale } from '#lib/i18n/index.svelte.ts';
import { enCopy } from './en.ts';
import { trCopy } from './tr.ts';
import type { SiteCopy } from './types.ts';

export type { Faq, HomeCopy, PageCopy, Section, SiteCopy } from './types.ts';

const copies: Record<Locale, SiteCopy> = { tr: trCopy, en: enCopy };

export function copyFor(locale: Locale): SiteCopy {
	return copies[locale];
}
