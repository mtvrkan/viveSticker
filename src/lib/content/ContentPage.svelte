<script lang="ts">
	import Studio from '#lib/features/studio/Studio.svelte';
	import { i18n, t } from '#lib/i18n/index.svelte.ts';
	import { breadcrumbLd, faqLd, webApplicationLd } from '#lib/seo/jsonld.ts';
	import { pageHref } from '#lib/seo/links.ts';
	import Seo from '#lib/seo/Seo.svelte';
	import { pagePath, SITE_NAME, type ContentId } from '#lib/seo/site.ts';
	import Breadcrumb from './Breadcrumb.svelte';
	import FaqList from './FaqList.svelte';
	import { copyFor } from './index.ts';
	import RelatedLinks from './RelatedLinks.svelte';
	import SectionBlock from './SectionBlock.svelte';

	let { id }: { id: ContentId } = $props();

	const locale = $derived(i18n.locale);
	const copy = $derived(copyFor(locale).pages[id]);
	const crumbs = $derived([
		{ name: t('breadcrumbHome'), href: pageHref('home', locale), path: pagePath('home', locale) },
		{ name: copy.label, href: pageHref(id, locale), path: pagePath(id, locale) }
	]);
	const jsonLd = $derived([
		copy.tool
			? webApplicationLd(locale, `${SITE_NAME}: ${copy.label}`, copy.description, pagePath(id, locale))
			: null,
		breadcrumbLd(crumbs.map(({ name, path }) => ({ name, path }))),
		faqLd(copy.faq)
	]);
</script>

<Seo {id} title={copy.title} description={copy.description} {jsonLd} />

{#snippet header()}
	<div class="flex flex-col gap-4">
		<Breadcrumb items={crumbs} />
		<h1 class="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{copy.heading}</h1>
		<p class="text-lg leading-relaxed text-muted-foreground">{copy.lead}</p>
	</div>
{/snippet}

{#snippet body()}
	<div class="mx-auto mt-12 flex max-w-3xl flex-col gap-12">
		{#each copy.sections as section (section.heading)}
			<SectionBlock {section} />
		{/each}
		{#if !copy.tool}
			<aside class="flex flex-col items-start gap-3 rounded-xl bg-brand p-6 shadow-float">
				<p class="text-lg font-bold">{t('ctaMake')}</p>
				<p class="opacity-90">{t('ctaMakeText')}</p>
				<a
					href={pageHref('home', locale)}
					class="flex min-h-11 items-center rounded-full bg-card px-5 text-sm font-semibold text-foreground transition-colors duration-(--duration-fast) hover:bg-muted"
				>
					{t('ctaMake')}
				</a>
			</aside>
		{/if}
		<FaqList faq={copy.faq} />
		<RelatedLinks ids={copy.related} heading={t('relatedHeading')} />
	</div>
{/snippet}

{#if copy.tool}
	<Studio heading="h2" shelf={false} lead={header} after={body} />
{:else}
	<div class="mx-auto max-w-3xl pt-4">
		{@render header()}
	</div>
	{@render body()}
{/if}
