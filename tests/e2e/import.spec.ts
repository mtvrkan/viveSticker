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
	await page.getByRole('button', { name: 'EN' }).click();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Start with a file');
});
