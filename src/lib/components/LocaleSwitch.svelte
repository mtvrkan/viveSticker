<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { i18n, rememberLocale, t } from '#lib/i18n/index.svelte.ts';
	import { pageHref } from '#lib/seo/links.ts';
	import { pageIdFrom } from '#lib/seo/site.ts';
	import { hydration } from './hydration.svelte.ts';

	const next = $derived(i18n.locale === 'tr' ? 'en' : 'tr');

	// Same page in the other language. The route stays the same, so an open editor keeps its state.
	function swap() {
		rememberLocale(next);
		const id = pageIdFrom(page.route.id, page.params) ?? 'home';
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- pageHref resolves through $app/paths
		void goto(`${pageHref(id, next)}${page.url.search}`);
	}
</script>

<button
	type="button"
	lang={next}
	disabled={!hydration.done}
	onclick={swap}
	class="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-sm font-bold shadow-soft transition-colors duration-(--duration-fast) hover:bg-muted"
>
	<span class="sr-only">{t('languageLabel')}: </span>{next.toUpperCase()}
</button>
