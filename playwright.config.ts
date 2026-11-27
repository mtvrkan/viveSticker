import { defineConfig, devices } from '@playwright/test';

const port = 4173;

export default defineConfig({
	testDir: 'tests/e2e',
	outputDir: process.env.PW_OUTPUT_DIR ?? 'test-results',
	reporter: 'list',
	use: { baseURL: `http://127.0.0.1:${port}/`, locale: 'tr-TR' },
	webServer: {
		// Production serves from the domain root (sticker.vivepdf.com), so the tests do too.
		command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${port} --strictPort`,
		env: { BASE_PATH: '' },
		url: `http://127.0.0.1:${port}/`,
		reuseExistingServer: false,
		timeout: 120_000
	},
	projects: [
		{ name: 'iphone-webkit', use: { ...devices['iPhone 15'] } },
		{ name: 'ipad-webkit', use: { ...devices['iPad Pro 11'] } },
		{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } }
	]
});
