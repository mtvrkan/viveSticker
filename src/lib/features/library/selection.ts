import { PACK_MAX_STICKERS } from '#lib/core/whatsapp.ts';

export const SELECT_PARAM = 'select';

export function selectionQuery(ids: readonly string[]): string {
	const params = new URLSearchParams({ [SELECT_PARAM]: ids.slice(0, PACK_MAX_STICKERS).join(',') });
	return `?${params.toString()}`;
}

export function readSelection(search: string): string[] {
	const raw = new URLSearchParams(search).get(SELECT_PARAM);
	if (!raw) return [];
	const ids = raw
		.split(',')
		.map((id) => id.trim())
		.filter((id) => id.length > 0);
	return [...new Set(ids)].slice(0, PACK_MAX_STICKERS);
}
