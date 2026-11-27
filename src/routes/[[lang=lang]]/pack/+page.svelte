<script lang="ts">
	import { copyFor } from '#lib/content/index.ts';
	import { PackScreen } from '#lib/features/library/index.ts';
	import { i18n } from '#lib/i18n/index.svelte.ts';
	import Seo from '#lib/seo/Seo.svelte';

	const library = $derived(copyFor(i18n.locale).library);
</script>

<Seo id="library" title={library.title} description={library.description} />

<PackScreen />
