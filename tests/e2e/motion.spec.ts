import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { animatedGif, recordedVideo } from './fixtures.ts';

const shotDir = process.env.SHOT_DIR;

async function shot(page: Page, name: string) {
	if (shotDir)
		await page.screenshot({ path: `${shotDir}/${test.info().project.name}-${name}.png`, fullPage: true });
}

async function buildAndDownload(page: Page) {
	await expect(page.getByRole('status').filter({ hasText: 'Tahmine göre sınıra uygun' })).toBeVisible({
		timeout: 60_000
	});
	await page.getByRole('button', { name: 'Çıkartmayı oluştur' }).click();
	const button = page.getByRole('button', { name: 'WebP indir' });
	await expect(button).toBeEnabled({ timeout: 120_000 });
	const download = page.waitForEvent('download');
	await button.click();
	const file = await download;
	const bytes = await readFile((await file.path())!);
	expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
	expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
	expect(bytes.includes(Buffer.from('ANMF'))).toBe(true);
	expect(bytes.byteLength).toBeLessThanOrEqual(500 * 1024);
	return file.suggestedFilename();
}

test('turns a GIF into an animated sticker', async ({ page }) => {
	test.setTimeout(180_000);
	await page.goto('./');
	await page
		.locator('input[type=file]')
		.setInputFiles({ name: 'wave.gif', mimeType: 'image/gif', buffer: animatedGif(120, 90, 12) });
	await expect(page.getByText('Hareketli görsel')).toBeVisible();
	await page.getByRole('button', { name: 'Düzenlemeye geç' }).click();
	await expect(page.getByRole('button', { name: 'Duraklat' })).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText('Çıkartma süresi: 1,2 s')).toBeVisible();
	await page.getByRole('tab', { name: 'Arka plan' }).click();
	await page.getByRole('checkbox', { name: 'Kişiyi otomatik ayır' }).check();
	await expect(page.getByText(/model yükleniyor/i)).toBeHidden({ timeout: 60_000 });
	await expect(page.getByText('Arka plan silme bu tarayıcıda çalışmadı')).toBeHidden();
	await shot(page, 'gif-editor');
	expect(await buildAndDownload(page)).toBe('wave-sticker.webp');
	await shot(page, 'gif-built');
});

test('cuts two ranges from a video', async ({ page }) => {
	test.setTimeout(240_000);
	await page.goto('./');
	const video = await recordedVideo(page);
	test.skip(!video, 'This browser build cannot record and play back a test clip');
	await page
		.locator('input[type=file]')
		.setInputFiles({ name: video!.name, mimeType: video!.mime, buffer: video!.buffer });
	await page.getByRole('button', { name: 'Düzenlemeye geç' }).click();
	await expect(page.getByRole('slider', { name: 'Bitiş' })).toBeVisible({ timeout: 30_000 });
	await page.getByRole('button', { name: 'Duraklat' }).click();
	await page.getByRole('button', { name: '2×' }).click();
	await expect(page.getByText(/Çıkartma süresi: 1,[0-9] s/)).toBeVisible();
	await page.getByRole('button', { name: '+ Aralık ekle' }).click();
	await expect(page.getByRole('button', { name: /^2 · / })).toHaveAttribute('aria-pressed', 'true');
	await shot(page, 'video-editor');
	expect(await buildAndDownload(page)).toBe('clip-2-sticker.webp');
});
