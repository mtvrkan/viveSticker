import { localeFromParam } from '#lib/seo/site.ts';
import type { LayoutLoad } from './$types';

export const prerender = true;

export const load: LayoutLoad = ({ params }) => ({ locale: localeFromParam(params.lang) });
