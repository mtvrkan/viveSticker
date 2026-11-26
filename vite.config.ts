import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

const base = process.env.BASE_PATH ?? '';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter({ fallback: '404.html' }),
			paths: { base: base === '' ? '' : `/${base.replace(/^\/+|\/+$/g, '')}` }
		})
	],
	test: { include: ['src/**/*.test.ts'] }
});
