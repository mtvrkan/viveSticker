import type { Handle } from '@sveltejs/kit/hooks';
import { localeFromParam } from '#lib/seo/site.ts';

// Prerendered HTML carries the page language in <html lang>, before any script runs.
export const handle: Handle = ({ event, resolve }) => {
	const lang = localeFromParam(event.params.lang);
	return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
};
