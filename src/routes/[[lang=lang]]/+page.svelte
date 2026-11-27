<script lang="ts">
	import { copyFor } from '#lib/content/index.ts';
	import HomeContent from '#lib/content/HomeContent.svelte';
	import Studio from '#lib/features/studio/Studio.svelte';
	import { i18n } from '#lib/i18n/index.svelte.ts';
	import { faqLd, webApplicationLd, websiteLd } from '#lib/seo/jsonld.ts';
	import Seo from '#lib/seo/Seo.svelte';
	import { pagePath, SITE_NAME } from '#lib/seo/site.ts';

	const home = $derived(copyFor(i18n.locale).home);
	const jsonLd = $derived([
		websiteLd(i18n.locale, home.description),
		webApplicationLd(i18n.locale, SITE_NAME, home.description, pagePath('home', i18n.locale)),
		faqLd(home.faq)
	]);
</script>

<Seo id="home" title={home.title} description={home.description} {jsonLd} />

<Studio>
	{#snippet after()}
		<HomeContent />
	{/snippet}
</Studio>
