import { expect, test } from '@playwright/test';

test('site menu lists tools and guides, navigates and closes', async ({ page, viewport }) => {
	await page.goto('./');
	const trigger =
		(viewport?.width ?? 0) < 768
			? page.getByRole('button', { name: 'Menü' })
			: page.getByRole('button', { name: 'Araçlar' });
	const menu = page.getByRole('navigation', { name: 'Araçlar ve rehberler' });
	await expect(menu).toBeHidden();

	await trigger.click();
	await expect(menu).toBeVisible();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect(menu.getByRole('link', { name: /Sıkça sorulan sorular/ })).toBeVisible();

	await menu.getByRole('link', { name: /GIF’ten çıkartma/ }).click();
	await expect(page).toHaveURL(/gif-ten-cikartma$/);
	await expect(menu).toBeHidden();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('Escape closes the site menu', async ({ page, viewport }) => {
	await page.goto('./en/');
	const trigger =
		(viewport?.width ?? 0) < 768
			? page.getByRole('button', { name: 'Menu' })
			: page.getByRole('button', { name: 'Tools' });
	await trigger.click();
	const menu = page.getByRole('navigation', { name: 'Tools and guides' });
	await expect(menu).toBeVisible();
	await expect(menu.getByRole('link', { name: /Remove the background on your device/ })).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(menu).toBeHidden();
});

test('theme toggle pins the opposite theme and survives a reload', async ({ page, viewport }) => {
	test.skip(
		(viewport?.width ?? 0) < 768,
		'The header theme toggle shows from tablet width; phones use the menu.'
	);
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('./');
	const toggle = page.getByRole('button', { name: 'Koyu tema' });
	await expect(toggle).toHaveAttribute('aria-pressed', 'false');

	await toggle.click();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await expect(toggle).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByRole('radio', { name: 'Koyu' })).toBeChecked();

	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

	// Back to light matches the system, so the site follows the system again.
	await page.getByRole('button', { name: 'Koyu tema' }).click();
	await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
	await expect(page.getByRole('radio', { name: 'Sistem' })).toBeChecked();
});
