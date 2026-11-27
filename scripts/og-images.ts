/**
 * Renders the 1200×630 Open Graph card of every page into static/og/<locale>-<id>.png.
 * Run after changing page headings: `pnpm og` (needs `npx playwright install chromium` once).
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { enCopy } from '../src/lib/content/en.ts';
import { trCopy } from '../src/lib/content/tr.ts';
import type { SiteCopy } from '../src/lib/content/types.ts';
import { CONTENT_IDS, OG_SIZE, PAGE_IDS, type PageId } from '../src/lib/seo/site.ts';

const out = new URL('../static/og/', import.meta.url);
const font = import.meta.resolve('@fontsource-variable/instrument-sans/wght.css');
const copies = { tr: trCopy, en: enCopy } satisfies Record<string, SiteCopy>;
const tagline = {
	tr: 'Ücretsiz WhatsApp çıkartması · tarayıcında',
	en: 'Free WhatsApp stickers · in your browser'
};

function headline(copy: SiteCopy, id: PageId): string {
	if (id === 'home') return copy.home.intro.heading;
	if (id === 'library') return copy.library.title.replace(/\s*\|.*$/, '');
	return copy.pages[id].heading;
}

const escape = (text: string) =>
	text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!);

function card(title: string, sub: string): string {
	return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${font}"><style>
	* { margin: 0; box-sizing: border-box; }
	body { width: ${OG_SIZE.width}px; height: ${OG_SIZE.height}px; font-family: 'Instrument Sans Variable', sans-serif;
		background: linear-gradient(135deg, #6d4aff 0%, #2f5bea 100%); color: #fff; padding: 72px 80px;
		display: flex; flex-direction: column; justify-content: space-between; }
	.brand { display: flex; align-items: center; gap: 18px; font-size: 40px; font-weight: 700; letter-spacing: -0.01em; }
	h1 { font-size: 76px; line-height: 1.05; font-weight: 700; letter-spacing: -0.025em; max-width: 980px; text-wrap: balance; }
	.foot { display: flex; justify-content: space-between; font-size: 28px; font-weight: 500; opacity: 0.9; }
	</style></head><body>
	<div class="brand"><svg viewBox="0 0 64 64" width="64" height="64">
		<path d="M58 38 38 58H24a18 18 0 0 1-18-18V24A18 18 0 0 1 24 6h16a18 18 0 0 1 18 18z" fill="#fff" fill-opacity="0.18"/>
		<path d="M58 38H44a6 6 0 0 0-6 6v14z" fill="#c9c0ff"/>
		<path d="M22 24l10 18 10-18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>viveSticker</div>
	<h1>${escape(title)}</h1>
	<div class="foot"><span>${escape(sub)}</span><span>sticker.vivepdf.com</span></div>
	</body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: OG_SIZE });
const scratch = await mkdtemp(join(tmpdir(), 'vivesticker-og-'));
const htmlFile = pathToFileURL(join(scratch, 'card.html'));
let count = 0;
for (const locale of ['tr', 'en'] as const) {
	for (const id of PAGE_IDS) {
		await writeFile(htmlFile, card(headline(copies[locale], id), tagline[locale]));
		await page.goto(htmlFile.href);
		await page.evaluate(() => document.fonts.ready);
		await page.screenshot({ path: fileURLToPath(new URL(`${locale}-${id}.png`, out)) });
		count++;
	}
}
await browser.close();
await rm(scratch, { recursive: true, force: true });
console.log(`Wrote ${count} Open Graph cards (${CONTENT_IDS.length + 2} pages × 2 languages).`);
