import { describe, expect, it } from 'vitest';
import { breadcrumbLd, faqLd, serializeLd, webApplicationLd } from './jsonld.ts';

describe('structured data', () => {
	it('numbers breadcrumb items from one with absolute URLs', () => {
		const ld = breadcrumbLd([
			{ name: 'Home', path: '/en/' },
			{ name: 'FAQ', path: '/en/faq' }
		]);
		expect(ld.itemListElement).toEqual([
			{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sticker.vivepdf.com/en/' },
			{ '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://sticker.vivepdf.com/en/faq' }
		]);
	});

	it('skips FAQ markup when there are no questions', () => {
		expect(faqLd([])).toBeNull();
		expect(faqLd([{ q: 'Q?', a: 'A.' }])?.mainEntity).toHaveLength(1);
	});

	it('marks the app as free', () => {
		const ld = webApplicationLd('tr', 'viveSticker', 'd', '/');
		expect(ld.offers).toEqual({ '@type': 'Offer', price: '0', priceCurrency: 'USD' });
		expect(ld.url).toBe('https://sticker.vivepdf.com/');
	});

	it('never lets content close the script element', () => {
		const json = serializeLd({ name: '</script><script>alert(1)</script>' });
		expect(json).not.toContain('<');
		expect(JSON.parse(json).name).toBe('</script><script>alert(1)</script>');
	});
});
