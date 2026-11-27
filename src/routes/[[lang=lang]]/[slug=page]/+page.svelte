<script lang="ts">
	import ContentPage from '#lib/content/ContentPage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

{#key data.id}
	<ContentPage id={data.id} />
{/key}
