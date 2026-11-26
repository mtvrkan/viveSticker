import { describe, expect, it } from 'vitest';
import { pickXMedia, xPostFromUrl } from './x-link.ts';

function payload(urls: string[]) {
	return { code: 200, tweet: { media: { all: urls.map((url) => ({ type: 'video', url })) } } };
}

describe('xPostFromUrl', () => {
	it('reads the post id from an x.com link with tracking parameters', () => {
		const post = xPostFromUrl(new URL('https://x.com/someone/status/2125630926977683606?s=46&t=abc'));

		expect(post).toEqual({ id: '2125630926977683606', index: 0 });
	});

	it('picks the numbered photo from a twitter.com media link', () => {
		const post = xPostFromUrl(new URL('https://mobile.twitter.com/someone/status/42/photo/3'));

		expect(post).toEqual({ id: '42', index: 2 });
	});

	it('returns null for profiles and other sites', () => {
		expect(xPostFromUrl(new URL('https://x.com/someone'))).toBeNull();
		expect(xPostFromUrl(new URL('https://example.com/someone/status/42'))).toBeNull();
	});
});

describe('pickXMedia', () => {
	it('returns the requested media file with an x-prefixed name', () => {
		const media = pickXMedia(
			payload(['https://pbs.twimg.com/media/a.jpg', 'https://video.twimg.com/vid/b.mp4?tag=29']),
			{ id: '42', index: 1 }
		);

		expect(media).toEqual({ url: 'https://video.twimg.com/vid/b.mp4?tag=29', name: 'x-42.mp4' });
	});

	it('falls back to the first media when the index is out of range', () => {
		const media = pickXMedia(payload(['https://pbs.twimg.com/media/a.jpg']), { id: '42', index: 4 });

		expect(media?.name).toBe('x-42.jpg');
	});

	it('rejects posts without media, malformed answers and hosts outside twimg.com', () => {
		expect(pickXMedia({ code: 404, message: 'NOT_FOUND' }, { id: '1', index: 0 })).toBeNull();
		expect(pickXMedia('oops', { id: '1', index: 0 })).toBeNull();
		expect(pickXMedia(payload(['https://evil.example/a.mp4']), { id: '1', index: 0 })).toBeNull();
		expect(pickXMedia(payload(['http://video.twimg.com/a.mp4']), { id: '1', index: 0 })).toBeNull();
	});
});
