import { defineConfig, devices } from '@playwright/test';

const port = 4173;

export default defineConfig({
	testDir: 'tests/e2e',
	outputDir: process.env.PW_OUTPUT_DIR ?? 'test-results',
	reporter: 'list',
	use: { baseURL: `http://127.0.0.1:${port}/viveSticker/`, locale: 'tr-TR' },
	webServer: {
		command: `export BASE_PATH=viveSticker && pnpm build && pnpm preview --host 127.0.0.1 --port ${port} --strictPort`,
		url: `http://127.0.0.1:${port}/viveSticker/`,
		reuseExistingServer: false,
		timeout: 120_000
	},
	projects: [
		{ name: 'iphone-webkit', use: { ...devices['iPhone 15'] } },
		{ name: 'ipad-webkit', use: { ...devices['iPad Pro 11'] } },
		{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } }
	]
});
