import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

const shotDir = process.env.SHOT_DIR;

async function shot(page: Page, name: string) {
	if (shotDir)
		await page.screenshot({ path: `${shotDir}/${test.info().project.name}-${name}.png`, fullPage: true });
}

async function ballPhoto(page: Page): Promise<Buffer> {
	const base64 = await page.evaluate(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 600;
		canvas.height = 600;
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = 'rgb(60, 140, 70)';
		ctx.fillRect(0, 0, 600, 600);
		const gradient = ctx.createRadialGradient(260, 260, 20, 300, 300, 170);
		gradient.addColorStop(0, 'rgb(255, 220, 120)');
		gradient.addColorStop(1, 'rgb(230, 90, 30)');
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(300, 300, 160, 0, Math.PI * 2);
		ctx.fill();
		return canvas.toDataURL('image/png').split(',')[1]!;
	});
	return Buffer.from(base64, 'base64');
}

async function openEditor(page: Page) {
	await page.goto('./');
	await page
		.locator('input[type=file]')
		.setInputFiles({ name: 'ball.png', mimeType: 'image/png', buffer: await ballPhoto(page) });
	await page.getByRole('button', { name: 'Düzenlemeye geç' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'WhatsApp sınırına uygun' })).toBeVisible({
		timeout: 30_000
	});
}

async function exportPixels(page: Page, points: [number, number][]): Promise<number[][]> {
	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: 'WebP indir' }).click();
	const bytes = await readFile((await (await download).path())!);
	return page.evaluate(
		async ({ base64, points }) => {
			const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: 'image/webp' });
			const bitmap = await createImageBitmap(blob);
			const canvas = document.createElement('canvas');
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(bitmap, 0, 0);
			return points.map(([x, y]) => [...ctx.getImageData(x, y, 1, 1).data]);
		},
		{ base64: bytes.toString('base64'), points }
	);
}

test('removes the background around a tapped object', async ({ page }) => {
	test.setTimeout(120_000);
	await openEditor(page);
	await page.getByRole('tab', { name: 'Arka plan' }).click();
	await page.getByRole('button', { name: 'Nesneye dokun' }).click();
	const canvas = page.getByRole('img', { name: 'Düzenleme alanı' }).locator('canvas');
	await canvas.scrollIntoViewIfNeeded();
	const box = (await canvas.boundingBox())!;
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await expect(page.getByText('Seçilen parça: 1')).toBeVisible();
	await expect(page.getByText(/model yükleniyor|siliniyor/i)).toBeHidden({ timeout: 60_000 });
	await expect(page.getByText('Arka plan silme bu tarayıcıda çalışmadı')).toBeHidden();
	await page.getByRole('button', { name: 'Seçimi bitir' }).click();
	await page.getByRole('slider', { name: 'Kontur kalınlığı' }).fill('10');
	await expect(page.getByRole('status').filter({ hasText: 'WhatsApp sınırına uygun' })).toBeVisible({
		timeout: 30_000
	});
	await shot(page, 'cutout');
	const [corner, center] = await exportPixels(page, [
		[40, 40],
		[256, 256]
	]);
	expect(corner![3]).toBe(0);
	expect(center![3]).toBe(255);
});

test('adds text, an emoji and a drawing', async ({ page }) => {
	await openEditor(page);
	await page.getByRole('tab', { name: 'Yazı' }).click();
	await page.getByRole('button', { name: '+ Yazı ekle' }).click();
	await page.getByRole('textbox', { name: 'Metin' }).fill('Süper!');
	await page.getByRole('button', { name: 'El yazısı' }).click();
	await page.getByRole('button', { name: 'Emoji 🔥' }).click();
	await expect(page.getByRole('button', { name: 'Süper!' })).toBeVisible();
	await page.getByRole('tab', { name: 'Çizim' }).click();
	await page.getByRole('button', { name: 'Çizmeye başla' }).click();
	const canvas = page.getByRole('img', { name: 'Düzenleme alanı' }).locator('canvas');
	await canvas.scrollIntoViewIfNeeded();
	const box = (await canvas.boundingBox())!;
	await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.3, { steps: 8 });
	await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.2, { steps: 8 });
	await page.mouse.up();
	await expect(page.getByRole('button', { name: 'Çizimleri temizle' })).toBeEnabled();
	await page.getByRole('button', { name: 'Geri al' }).click();
	await expect(page.getByRole('button', { name: 'Çizimleri temizle' })).toBeDisabled();
	await page.getByRole('button', { name: 'Yinele' }).click();
	await page.getByRole('button', { name: 'Çizimi bitir' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'WhatsApp sınırına uygun' })).toBeVisible({
		timeout: 30_000
	});
	await shot(page, 'layers');
	const [stroke] = await exportPixels(page, [[256, 137]]);
	expect(stroke![0]).toBeGreaterThan(200);
	expect(stroke![1]).toBeLessThan(120);
});
