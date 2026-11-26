export const X_MEDIA_API = 'https://api.fxtwitter.com/status/';

const X_HOSTS = new Set([
	'x.com',
	'www.x.com',
	'mobile.x.com',
	'twitter.com',
	'www.twitter.com',
	'mobile.twitter.com',
	'fxtwitter.com',
	'vxtwitter.com',
	'fixupx.com'
]);
const MEDIA_HOST_SUFFIX = '.twimg.com';
const STATUS_PATTERN = /\/status(?:es)?\/(\d+)(?:\/(?:photo|video)\/(\d+))?/;

export type XPost = { id: string; index: number };

export function xPostFromUrl(url: URL): XPost | null {
	if (!X_HOSTS.has(url.hostname.toLowerCase())) return null;
	const match = STATUS_PATTERN.exec(url.pathname);
	if (!match?.[1]) return null;
	const position = Number(match[2] ?? '1');
	return { id: match[1], index: Math.max(0, position - 1) };
}

export function isXUrl(url: URL): boolean {
	return X_HOSTS.has(url.hostname.toLowerCase());
}

function mediaList(payload: unknown): unknown[] {
	if (typeof payload !== 'object' || payload === null) return [];
	const tweet = (payload as { tweet?: unknown }).tweet;
	if (typeof tweet !== 'object' || tweet === null) return [];
	const media = (tweet as { media?: unknown }).media;
	if (typeof media !== 'object' || media === null) return [];
	const all = (media as { all?: unknown }).all;
	return Array.isArray(all) ? all : [];
}

export function pickXMedia(payload: unknown, post: XPost): { url: string; name: string } | null {
	const items = mediaList(payload);
	const item = items[post.index] ?? items[0];
	if (typeof item !== 'object' || item === null) return null;
	const raw = (item as { url?: unknown }).url;
	if (typeof raw !== 'string') return null;
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		return null;
	}
	if (url.protocol !== 'https:' || !url.hostname.endsWith(MEDIA_HOST_SUFFIX)) return null;
	const extension = url.pathname.split('.').pop()?.toLowerCase() ?? '';
	return { url: url.href, name: extension ? `x-${post.id}.${extension}` : `x-${post.id}` };
}
