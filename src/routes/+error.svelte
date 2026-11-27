<script lang="ts">
	import { page } from '$app/state';
	import { i18n, t } from '#lib/i18n/index.svelte.ts';
	import { pageHref } from '#lib/seo/links.ts';
	import Seo from '#lib/seo/Seo.svelte';

	const missing = $derived(page.status === 404);
	const title = $derived(missing ? t('notFoundTitle') : t('pageErrorTitle'));
</script>

<Seo id={null} title="{title} · viveSticker" description={missing ? t('notFoundText') : t('pageErrorText')} />

<section class="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
	<svg
		aria-hidden="true"
		viewBox="0 0 24 24"
		class="size-12 text-muted-foreground"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<circle cx="12" cy="12" r="9" />
		<path d="M9 10h.01M15 10h.01M9 16c1.5-1.3 4.5-1.3 6 0" />
	</svg>
	<h1 class="text-2xl font-bold tracking-tight">{title}</h1>
	<p class="text-muted-foreground">{missing ? t('notFoundText') : t('pageErrorText')}</p>
	<a
		href={pageHref('home', i18n.locale)}
		class="flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary-hover"
	>
		{t('notFoundCta')}
	</a>
</section>
