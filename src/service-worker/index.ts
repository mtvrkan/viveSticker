import { assets, immutable, prerendered } from '$app/manifest';
import { self as worker } from '$app/service-worker';
import {
	SHARE_CACHE,
	SHARE_FIELD,
	SHARE_KEY,
	SHARE_NAME_HEADER,
	SHARE_PARAM,
	SKIP_WAITING
} from '#lib/core/share.ts';

const scope = new URL('./', worker.location.href);
const base = scope.pathname.replace(/\/$/, '');
const toPath = (path: string) => new URL(path.replace(/^\//, ''), scope).pathname;
function fingerprint(values: string[]): string {
	let hash = 5381;
	for (const value of values)
		for (let i = 0; i < value.length; i++) hash = ((hash * 33) ^ value.charCodeAt(i)) >>> 0;
	return hash.toString(36);
}

const CORE = `core-${fingerprint([...immutable, ...assets].map((entry) => entry.path))}`;
const HEAVY = 'heavy-v1';
const FONTS = 'fonts-v2';
const KEPT = new Set([CORE, HEAVY, FONTS, SHARE_CACHE]);

const isHeavy = (path: string) => path.endsWith('.wasm') || path.endsWith('.tflite');
// Font packages ship every unicode subset and the browser fetches only the ones a page needs,
// so fonts are cached on first use instead of precaching cyrillic/greek/vietnamese files.
const isFont = (path: string) => path.endsWith('.woff2') || path.endsWith('.woff');
const isMeta = (path: string) => path.endsWith('/.nojekyll') || path.endsWith('/CNAME');
const known = new Set([...immutable, ...assets, ...prerendered].map((entry) => toPath(entry.path)));
known.add(`${base}/`);
const precache = [...known].filter((path) => !isHeavy(path) && !isFont(path) && !isMeta(path));

worker.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CORE).then((cache) => cache.addAll(precache)));
});

// A new version waits until the page asks for it, so an open editor is never swapped mid-edit.
worker.addEventListener('message', (event) => {
	if (event.data === SKIP_WAITING) void worker.skipWaiting();
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => !KEPT.has(key)).map((key) => caches.delete(key))))
			.then(() => worker.clients.claim())
	);
});

async function cacheFirst(request: Request, name: string): Promise<Response> {
	const cache = await caches.open(name);
	const hit = await cache.match(request, { ignoreVary: true });
	if (hit) return hit;
	const response = await fetch(request);
	if (response.ok) await cache.put(request, response.clone());
	return response;
}

async function navigate(request: Request, path: string): Promise<Response> {
	try {
		return await fetch(request);
	} catch {
		const cache = await caches.open(CORE);
		const trimmed = path.replace(/\/$/, '');
		return (
			(await cache.match(path, { ignoreVary: true })) ??
			(await cache.match(trimmed, { ignoreVary: true })) ??
			(await cache.match(`${base}/`, { ignoreVary: true })) ??
			(await cache.match(base, { ignoreVary: true })) ??
			Response.error()
		);
	}
}

async function receiveShare(request: Request): Promise<Response> {
	const target = `${base}/?${SHARE_PARAM}=1`;
	try {
		const form = await request.formData();
		const file = form.getAll(SHARE_FIELD).find((value): value is File => value instanceof File);
		if (file) {
			const cache = await caches.open(SHARE_CACHE);
			await cache.put(
				SHARE_KEY,
				new Response(file, {
					headers: {
						'content-type': file.type || 'application/octet-stream',
						[SHARE_NAME_HEADER]: encodeURIComponent(file.name || 'shared')
					}
				})
			);
		}
	} catch {
		return Response.redirect(`${base}/`, 303);
	}
	return Response.redirect(target, 303);
}

worker.addEventListener('fetch', (event) => {
	const request = event.request;
	const url = new URL(request.url);
	if (
		request.method === 'POST' &&
		url.origin === worker.location.origin &&
		url.pathname === `${base}/share-target`
	) {
		event.respondWith(receiveShare(request));
		return;
	}
	if (request.method !== 'GET' || url.origin !== worker.location.origin) return;
	if (request.mode === 'navigate') {
		event.respondWith(navigate(request, url.pathname));
		return;
	}
	if (!known.has(url.pathname)) return;
	const cache = isHeavy(url.pathname) ? HEAVY : isFont(url.pathname) ? FONTS : CORE;
	event.respondWith(cacheFirst(request, cache));
});
