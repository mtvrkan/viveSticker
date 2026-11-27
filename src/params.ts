import { defineParams } from '@sveltejs/kit/params';
import { isContentSlug, type ContentSlug } from '#lib/seo/site.ts';

/**
 * A route param accepted only when `test` passes. SvelteKit 3 takes Standard Schema validators
 * for params; a failed validation means the route does not match, so the next route is tried.
 */
function only<T extends string>(test: (value: string) => value is T) {
	return {
		'~standard': {
			version: 1 as const,
			vendor: 'vivesticker',
			validate: (value: unknown) =>
				typeof value === 'string' && test(value) ? { value } : { issues: [{ message: 'No match' }] },
			types: undefined as unknown as { input: string; output: T }
		}
	};
}

export const params = defineParams({
	/** Only non-default locales get a URL prefix; Turkish lives at the root. */
	lang: only((value): value is 'en' => value === 'en'),
	/** A content page slug in either language; the page load checks it against the URL's locale. */
	page: only((value): value is ContentSlug => isContentSlug(value))
});
