import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const shotDir = process.env.SHOT_DIR;

async function shot(page: Page, name: string) {
	if (shotDir)
		await page.screenshot({ path: `${shotDir}/${test.info().project.name}-${name}.png`, fullPage: true });
}

async function photo(page: Page): Promise<Buffer> {
	const base64 = await page.evaluate(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 900;
		canvas.height = 600;
		const ctx = canvas.getContext('2d')!;
		const gradient = ctx.createLinearGradient(0, 0, 900, 600);
		gradient.addColorStop(0, 'rgb(240, 120, 40)');
		gradient.addColorStop(1, 'rgb(40, 90, 220)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 900, 600);
		for (let i = 0; i < 4000; i++) {
			ctx.fillStyle = `rgba(${(i * 37) % 255}, ${(i * 91) % 255}, ${(i * 53) % 255}, 0.5)`;
			ctx.fillRect((i * 131) % 900, (i * 71) % 600, 6, 6);
		}
		return canvas.toDataURL('image/png').split(',')[1]!;
	});
	return Buffer.from(base64, 'base64');
}

async function openEditor(page: Page) {
	await page.goto('./');
	const buffer = await photo(page);
	await page
		.locator('input[type=file]')
		.setInputFiles({ name: 'beach day.png', mimeType: 'image/png', buffer });
	await page.getByRole('button', { name: 'Düzenlemeye geç' }).click();
	await expect(page.getByRole('heading', { name: 'Çıkartmayı düzenle' })).toBeVisible();
	await expect(page.getByRole('status').filter({ hasText: 'WhatsApp sınırına uygun' })).toBeVisible({
		timeout: 30_000
	});
}

test('exports a WebP sticker within the WhatsApp limit', async ({ page }) => {
	await openEditor(page);
	await shot(page, 'editor');
	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: 'WebP indir' }).click();
	const file = await download;
	expect(file.suggestedFilename()).toBe('beach-day-sticker.webp');
	const bytes = await readFile((await file.path())!);
	expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
	expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
	expect(bytes.byteLength).toBeLessThanOrEqual(100 * 1024);
});

test('changes shape and undoes it', async ({ page }) => {
	await openEditor(page);
	await page.getByRole('button', { name: 'Kalp' }).click();
	await expect(page.getByRole('button', { name: 'Kalp' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('status').filter({ hasText: 'WhatsApp sınırına uygun' })).toBeVisible({
		timeout: 30_000
	});
	await shot(page, 'heart');
	await page.getByRole('button', { name: 'Geri al' }).click();
	await expect(page.getByRole('button', { name: 'Dikdörtgen' })).toHaveAttribute('aria-pressed', 'true');
});

test('cuts a freehand shape', async ({ page }) => {
	await openEditor(page);
	await page.getByRole('button', { name: 'Serbest' }).click();
	await expect(page.getByRole('tabpanel').getByText('Kesmek istediğin alanın')).toBeVisible();
	const stage = page.getByRole('img', { name: 'Düzenleme alanı' });
	await stage.scrollIntoViewIfNeeded();
	await page.waitForTimeout(400);
	const box = (await stage.boundingBox())!;
	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	const r = box.width * 0.25;
	await page.mouse.move(cx + r, cy);
	await page.mouse.down();
	for (let i = 1; i <= 40; i++) {
		const a = (i / 40) * Math.PI * 2;
		await page.mouse.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.7);
	}
	await page.mouse.up();
	await expect(page.getByRole('button', { name: 'Yeniden çiz' })).toBeVisible();
	await expect(page.getByRole('status').filter({ hasText: 'WhatsApp sınırına uygun' })).toBeVisible({
		timeout: 30_000
	});
	await shot(page, 'lasso');
});

test('positions the image with the panel controls', async ({ page }) => {
	await openEditor(page);
	await page.getByRole('tab', { name: 'Konum' }).click();
	await page.getByRole('button', { name: 'Doldur' }).click();
	await expect(page.getByText('150%')).toBeVisible();
	await page.getByRole('button', { name: '90° döndür' }).click();
	await expect(page.getByText('90°', { exact: true })).toBeVisible();
	await page.getByRole('tab', { name: 'Kalite' }).click();
	await page.getByRole('button', { name: 'Elle' }).click();
	await expect(page.getByRole('slider', { name: 'Kalite düzeyi' })).toBeVisible();
	await shot(page, 'panels');
});
