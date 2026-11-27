import { error } from '@sveltejs/kit';
import { CONTENT_IDS, CONTENT_PAGES, contentBySlug, localeFromParam } from '#lib/seo/site.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	CONTENT_IDS.flatMap((id) => [{ slug: CONTENT_PAGES[id].tr }, { lang: 'en', slug: CONTENT_PAGES[id].en }]);

// The matcher accepts a slug from either language; a page only exists under its own one.
export const load: PageLoad = ({ params }) => {
	const id = contentBySlug(params.slug, localeFromParam(params.lang));
	if (!id) error(404, 'Not found');
	return { id };
};
