<script lang="ts">
	import { i18n } from '#lib/i18n/index.svelte.ts';
	import { serializeLd, type JsonLd } from './jsonld.ts';
	import {
		absoluteUrl,
		DEFAULT_LOCALE,
		LOCALES,
		OG_LOCALE,
		OG_SIZE,
		pagePath,
		SITE_NAME,
		type PageId
	} from './site.ts';

	interface Props {
		/** `null` for pages that must not be indexed, such as the 404 page. */
		id: PageId | null;
		title: string;
		description: string;
		jsonLd?: (JsonLd | null)[];
	}

	let { id, title, description, jsonLd = [] }: Props = $props();

	const locale = $derived(i18n.locale);
	const canonical = $derived(id ? absoluteUrl(pagePath(id, locale)) : null);
	const image = $derived(absoluteUrl(`/og/${locale}-${id ?? 'home'}.png`));
	const scripts = $derived(
		jsonLd
			.filter((entry): entry is JsonLd => entry !== null)
			.map((entry) => `<script type="application/ld+json">${serializeLd(entry)}</` + 'script>')
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if id && canonical}
		<link rel="canonical" href={canonical} />
		{#each LOCALES as alternate (alternate)}
			<link rel="alternate" hreflang={alternate} href={absoluteUrl(pagePath(id, alternate))} />
		{/each}
		<link rel="alternate" hreflang="x-default" href={absoluteUrl(pagePath(id, DEFAULT_LOCALE))} />
		<meta property="og:url" content={canonical} />
	{:else}
		<meta name="robots" content="noindex" />
	{/if}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:locale" content={OG_LOCALE[locale]} />
	{#each LOCALES.filter((other) => other !== locale) as other (other)}
		<meta property="og:locale:alternate" content={OG_LOCALE[other]} />
	{/each}
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content={String(OG_SIZE.width)} />
	<meta property="og:image:height" content={String(OG_SIZE.height)} />
	<meta property="og:image:alt" content={title} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	<!-- Our own static copy, serialised with `<` escaped (see serializeLd). -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html scripts.join('')}
</svelte:head>
