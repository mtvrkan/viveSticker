import { expect, test, type Page } from '@playwright/test';

async function controlled(page: Page) {
	await page.goto('./');
	const supported = await page.evaluate(() => 'serviceWorker' in navigator);
	test.skip(!supported, 'Service workers unavailable in this browser build');
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
	});
	await page.reload();
	await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

test('publishes an installable manifest with a share target', async ({ page }) => {
	const response = await page.request.get('./manifest.webmanifest');
	expect(response.ok()).toBe(true);
	const manifest = await response.json();
	expect(manifest.name).toBe('viveSticker');
	expect(manifest.share_target.method).toBe('POST');
	for (const icon of manifest.icons) expect((await page.request.get(`./${icon.src}`)).ok()).toBe(true);
});

test('opens both pages offline after the first visit', async ({ page, context }) => {
	await controlled(page);
	await context.setOffline(true);
	await page.reload();
	await expect(page.getByRole('heading', { name: 'Yeni çıkartma' })).toBeVisible();
	await page.getByRole('link', { name: 'Paketlerim' }).click();
	await expect(page.getByRole('heading', { name: 'Paketlerim', level: 1 })).toBeVisible();
	await context.setOffline(false);
});

test('receives a file shared from another app', async ({ page, browserName }) => {
	test.skip(browserName === 'webkit', 'Web Share Target exists only on Android browsers');
	await controlled(page);
	const status = await page.evaluate(async () => {
		const canvas = document.createElement('canvas');
		canvas.width = 300;
		canvas.height = 200;
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = 'rgb(200, 80, 120)';
		ctx.fillRect(0, 0, 300, 200);
		const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!), 'image/png'));
		const form = new FormData();
		form.append('media', new File([blob], 'paylaşılan foto.png', { type: 'image/png' }));
		const response = await fetch('./share-target', { method: 'POST', body: form });
		return { url: response.url };
	});
	expect(new URL(status.url).searchParams.get('shared')).toBe('1');
	await page.goto(status.url);
	await expect(page.getByText('paylaşılan foto.png')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Düzenlemeye geç' })).toBeVisible();
	expect(new URL(page.url()).search).toBe('');
});
