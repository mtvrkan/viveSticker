<script lang="ts">
	import '@fontsource-variable/instrument-sans/wght.css';
	import '@fontsource-variable/jetbrains-mono/wght.css';
	import '../app.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, untrack } from 'svelte';
	import AppShell from '#lib/components/AppShell.svelte';
	import { hydration } from '#lib/components/hydration.svelte.ts';
	import { SHARE_PARAM } from '#lib/core/share.ts';
	import { rememberedLocale, setLocale } from '#lib/i18n/index.svelte.ts';
	import { pageHref } from '#lib/seo/links.ts';
	import { pageIdFrom } from '#lib/seo/site.ts';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	// The URL decides the language. Setting it during render keeps prerendered HTML and hydration
	// identical; the effect follows client-side navigation between locales.
	$effect.pre(() => setLocale(data.locale));
	setLocale(untrack(() => data.locale));

	// A file shared into the installed app lands on `/?shared=1` and must stay on that page.
	const arrivedWithShare =
		typeof location !== 'undefined' && new URLSearchParams(location.search).has(SHARE_PARAM);

	// Only an explicit earlier choice from the language switch redirects; browser language never does,
	// so crawlers and first-time visitors always get the page they asked for.
	onMount(() => {
		hydration.done = true;
		const remembered = rememberedLocale();
		if (!remembered || remembered === data.locale || arrivedWithShare) return;
		const id = pageIdFrom(page.route.id, page.params);
		if (!id) return;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- pageHref resolves through $app/paths
		void goto(`${pageHref(id, remembered)}${location.search}${location.hash}`, { replaceState: true });
	});
</script>

<AppShell>
	{@render children()}
</AppShell>
