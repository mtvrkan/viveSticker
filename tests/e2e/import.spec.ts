import { expect, test } from '@playwright/test';

const onePixelPng = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
	'base64'
);

const shotDir = process.env.SHOT_DIR;

async function shot(page: import('@playwright/test').Page, name: string) {
	if (shotDir)
		await page.screenshot({ path: `${shotDir}/${test.info().project.name}-${name}.png`, fullPage: true });
}

test('imports a photo and shows its details', async ({ page }) => {
	await page.goto('./');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await shot(page, 'idle');
	await page
		.locator('input[type=file]')
		.setInputFiles({ name: 'dot.png', mimeType: 'image/png', buffer: onePixelPng });
	await expect(page.getByText('1×1')).toBeVisible();
	await shot(page, 'ready');
});

test('rejects an unsupported file and recovers', async ({ page }) => {
	await page.goto('./');
	await page
		.locator('input[type=file]')
		.setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
	const alert = page.getByRole('alert');
	await expect(alert).toBeVisible();
	await shot(page, 'error');
	await alert.getByRole('button').click();
	await expect(page.locator('input[type=file]')).toBeAttached();
});

test('switches the interface language', async ({ page }) => {
	await page.goto('./');
	await page.getByRole('button', { name: 'Dil: EN' }).click();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('New sticker');
});

test.describe('link import', () => {
	test.use({ serviceWorkers: 'block' });

	test('imports the media of an X post link', async ({ page }) => {
		const cors = { 'access-control-allow-origin': '*' };
		await page.route('https://api.fxtwitter.com/**', (route) =>
			route.fulfill({
				contentType: 'application/json',
				headers: cors,
				body: JSON.stringify({
					code: 200,
					tweet: { media: { all: [{ type: 'photo', url: 'https://pbs.twimg.com/media/dot.png' }] } }
				})
			})
		);
		await page.route('https://pbs.twimg.com/**', (route) =>
			route.fulfill({ contentType: 'image/png', headers: cors, body: onePixelPng })
		);
		await page.goto('./');
		await page.getByRole('button', { name: 'Bağlantı' }).click();
		await page
			.getByRole('textbox', { name: 'Bağlantıdan yükle' })
			.fill('https://x.com/someone/status/42?s=46');

		await page.getByRole('button', { name: 'Getir' }).click();

		await expect(page.getByText('1×1')).toBeVisible();
	});

	test('fetches an X post link from the paste button', async ({ page }) => {
		const cors = { 'access-control-allow-origin': '*' };
		await page.route('https://api.fxtwitter.com/**', (route) =>
			route.fulfill({
				contentType: 'application/json',
				headers: cors,
				body: JSON.stringify({
					code: 200,
					tweet: { media: { all: [{ type: 'photo', url: 'https://pbs.twimg.com/media/dot.png' }] } }
				})
			})
		);
		await page.route('https://pbs.twimg.com/**', (route) =>
			route.fulfill({ contentType: 'image/png', headers: cors, body: onePixelPng })
		);
		await page.goto('./');
		await page.evaluate(() => {
			const link = new Blob(['https://x.com/someone/status/42?s=46'], { type: 'text/plain' });
			navigator.clipboard.read = async () => [new ClipboardItem({ 'text/plain': link })];
		});

		await page.getByRole('button', { name: 'Yapıştır' }).click();

		await expect(page.getByText('1×1')).toBeVisible();
	});

	test('explains that a web page link is not a media file', async ({ page }) => {
		await page.route('https://example.com/**', (route) =>
			route.fulfill({
				contentType: 'text/html; charset=utf-8',
				headers: { 'access-control-allow-origin': '*' },
				body: '<html></html>'
			})
		);
		await page.goto('./');
		await page.getByRole('button', { name: 'Bağlantı' }).click();
		await page.getByRole('textbox', { name: 'Bağlantıdan yükle' }).fill('https://example.com/post');

		await page.getByRole('button', { name: 'Getir' }).click();

		await expect(page.getByRole('alert')).toContainText('web sayfası, medya dosyası değil');
	});
});
