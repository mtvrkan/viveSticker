import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: { projectService: true, extraFileExtensions: ['.svelte'], parser: ts.parser }
		}
	},
	{
		// Internal links go through `pageHref` (src/lib/seo/links.ts), which calls resolve() and adds the
		// locale prefix; the rule only recognises a literal resolve() at the link. goto/pushState stay checked.
		rules: { 'svelte/no-navigation-without-resolve': ['error', { ignoreLinks: true }] }
	},
	{ ignores: ['build/', '.svelte-kit/', 'node_modules/'] }
);
