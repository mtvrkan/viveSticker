import { expect, test } from '@playwright/test';

const ORIGIN = 'https://sticker.vivepdf.com';

test('home pages declare canonical, alternates and structured data', async ({ page }) => {
	await page.goto('./');
	await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
	await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `${ORIGIN}/`);
	await expect(page.locator('link[hreflang=en]')).toHaveAttribute('href', `${ORIGIN}/en/`);
	await expect(page.locator('link[hreflang=x-default]')).toHaveAttribute('href', `${ORIGIN}/`);
	await expect(page.locator('h1')).toHaveCount(1);
	const types = await page
		.locator('script[type="application/ld+json"]')
		.evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? '{}')['@type']));
	expect(types).toEqual(expect.arrayContaining(['WebSite', 'WebApplication', 'FAQPage']));

	await page.goto('./en/');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `${ORIGIN}/en/`);
	await expect(page.getByRole('heading', { name: 'New sticker', exact: true })).toBeVisible();
});

test('a guide page links to its translation and back', async ({ page }) => {
	await page.goto('./gif-ten-cikartma');
	await expect(page.locator('h1')).toHaveCount(1);
	await expect(page.locator('link[hreflang=en]')).toHaveAttribute('href', `${ORIGIN}/en/gif-to-sticker`);
	await page.getByRole('contentinfo').getByRole('link', { name: 'English' }).click();
	await expect(page).toHaveURL(/\/en\/gif-to-sticker$/);
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
});

test('the language switch keeps the visitor on the same page', async ({ page }) => {
	await page.goto('./sss');
	await page.getByRole('button', { name: /Dil/ }).click();
	await expect(page).toHaveURL(/\/en\/faq$/);
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	// The choice is remembered: opening a Turkish URL later lands on the English twin.
	await page.goto('./gizlilik');
	await expect(page).toHaveURL(/\/en\/privacy$/);
});

test('publishes a sitemap and robots file for the production origin', async ({ page }) => {
	const sitemap = await (await page.request.get('./sitemap.xml')).text();
	expect(sitemap).toContain(`<loc>${ORIGIN}/en/gif-to-sticker</loc>`);
	expect(sitemap).toContain(`hreflang="tr" href="${ORIGIN}/gif-ten-cikartma"`);
	const robots = await (await page.request.get('./robots.txt')).text();
	expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
});

test('unknown pages are not indexed', async ({ page }) => {
	await page.goto('./olmayan-sayfa');
	await expect(page.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeVisible();
	await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/);
});
