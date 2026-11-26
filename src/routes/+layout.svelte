<script lang="ts">
	import '../app.css';
	import { onMount, type Snippet } from 'svelte';
	import AppShell from '#lib/components/AppShell.svelte';
	import { detectLocale, setLocale } from '#lib/i18n/index.svelte.ts';

	let { children }: { children: Snippet } = $props();

	onMount(() => setLocale(detectLocale()));
</script>

<AppShell>
	{@render children()}
</AppShell>
