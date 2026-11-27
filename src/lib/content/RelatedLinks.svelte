<script lang="ts">
	import { i18n } from '#lib/i18n/index.svelte.ts';
	import { pageHref } from '#lib/seo/links.ts';
	import type { ContentId } from '#lib/seo/site.ts';
	import { copyFor } from './index.ts';

	let {
		ids,
		heading,
		headingId = 'related-title'
	}: { ids: ContentId[]; heading: string; headingId?: string } = $props();

	const pages = $derived(copyFor(i18n.locale).pages);
</script>

<section aria-labelledby={headingId} class="flex flex-col gap-4">
	<h2 id={headingId} class="text-xl font-bold tracking-tight">{heading}</h2>
	<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each ids as id (id)}
			<li>
				<a
					href={pageHref(id, i18n.locale)}
					class="flex h-full flex-col gap-1 rounded-lg bg-card p-4 shadow-soft transition-shadow duration-(--duration-base) hover:shadow-float"
				>
					<span class="font-semibold">{pages[id].label}</span>
					<span class="text-sm leading-relaxed text-muted-foreground">{pages[id].description}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
