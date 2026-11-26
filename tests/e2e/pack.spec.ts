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
		canvas.width = 640;
		canvas.height = 400;
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = 'rgb(250, 210, 80)';
		ctx.fillRect(0, 0, 640, 400);
		ctx.fillStyle = 'rgb(40, 60, 200)';
		ctx.fillRect(80, 60, 220, 280);
		return canvas.toDataURL('image/png').split(',')[1]!;
	});
	return Buffer.from(base64, 'base64');
}

async function downloadSticker(page: Page) {
	await expect(page.getByRole('status').filter({ hasText: 'WhatsApp sınırına uygun' })).toBeVisible({
		timeout: 30_000
	});
	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: 'WebP indir' }).click();
	await download;
}

test('shows an empty library with a way back to the editor', async ({ page }) => {
	await page.goto('./pack');
	await expect(page.getByRole('heading', { name: 'Henüz çıkartma yok' })).toBeVisible();
	await page.getByRole('link', { name: 'İlk çıkartmanı oluştur' }).click();
	await expect(page.getByRole('heading', { name: 'Yeni çıkartma' })).toBeVisible();
});

test('saves stickers automatically and exports a pack', async ({ page }) => {
	test.setTimeout(120_000);
	await page.goto('./');
	await page
		.locator('input[type=file]')
		.setInputFiles({ name: 'blue box.png', mimeType: 'image/png', buffer: await photo(page) });
	await page.getByRole('button', { name: 'Düzenlemeye geç' }).click();
	await downloadSticker(page);
	await expect(page.getByText('Kütüphaneye kaydedildi.')).toBeVisible();
	await page.getByRole('tab', { name: 'Konum' }).click();
	for (let i = 0; i < 2; i++) {
		await page.getByRole('button', { name: '90° döndür' }).click();
		await downloadSticker(page);
	}
	await page.getByRole('link', { name: 'Paketlerim' }).first().click();
	await expect(page.getByRole('heading', { name: 'Paketlerim', level: 1 })).toBeVisible();
	const items = page.getByRole('button', { name: /^Çıkartma blue box/ });
	await expect(items).toHaveCount(3);

	await page.getByRole('button', { name: '.wastickers indir' }).click();
	await expect(page.getByText('Paket adı gerekli.')).toBeVisible();
	await expect(page.getByText('Pakette en az 3 çıkartma olmalı.')).toBeVisible();

	for (let i = 0; i < 3; i++) await items.nth(i).click();
	await page.getByRole('textbox', { name: 'Paket adı' }).fill('Mavi Kutu');
	await page.getByRole('textbox', { name: 'Yayıncı' }).fill('Test');
	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: '.wastickers indir' }).click();
	const file = await download;
	expect(file.suggestedFilename()).toBe('Mavi-Kutu.wastickers');
	const bytes = await readFile((await file.path())!);
	expect(bytes.subarray(0, 2).toString('ascii')).toBe('PK');
	for (const name of ['title.txt', 'author.txt', 'tray.png', '01.webp', '03.webp'])
		expect(bytes.includes(Buffer.from(name))).toBe(true);

	await expect(page.getByRole('heading', { name: 'Kayıtlı paketler' })).toBeVisible();
	await expect(page.getByRole('listitem').filter({ hasText: 'Mavi Kutu' })).toBeVisible();
	await shot(page, 'pack');

	await page.reload();
	await expect(items).toHaveCount(3);
	await page.getByRole('button', { name: 'Sil', exact: true }).click();
	await page.getByRole('button', { name: 'Silmeyi onayla' }).click();
	await expect(page.getByRole('heading', { name: 'Kayıtlı paketler' })).toBeHidden();

	await page.getByRole('link', { name: 'Çıkartmalar' }).click();
	const shelf = page.getByRole('button', { name: /^Çıkartma blue box/ });
	await expect(shelf).toHaveCount(3);
	for (let i = 0; i < 3; i++) await shelf.nth(i).click();
	await expect(page.getByText('3 seçili')).toBeVisible();
	await shot(page, 'shelf');
	await page.getByRole('link', { name: 'Paket yap' }).click();
	await expect(page.getByRole('heading', { name: 'Paketlerim', level: 1 })).toBeVisible();
	await expect(page.getByText('Seçilen: 3 / 30')).toBeVisible();
	await expect(page).toHaveURL(/\/pack$/);
});
