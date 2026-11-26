import { SHARE_CACHE, SHARE_KEY, SHARE_NAME_HEADER, SHARE_PARAM } from '#lib/core/share.ts';

export function hasSharedFile(search: string): boolean {
	return new URLSearchParams(search).has(SHARE_PARAM);
}

export async function takeSharedFile(): Promise<{ blob: Blob; name: string } | null> {
	if (typeof caches === 'undefined') return null;
	const cache = await caches.open(SHARE_CACHE);
	const response = await cache.match(SHARE_KEY);
	if (!response) return null;
	await cache.delete(SHARE_KEY);
	let name = 'shared';
	try {
		name = decodeURIComponent(response.headers.get(SHARE_NAME_HEADER) ?? name);
	} catch {
		name = 'shared';
	}
	const type = response.headers.get('content-type') ?? '';
	const data = await response.blob();
	return { blob: data.type ? data : new Blob([data], { type }), name };
}
