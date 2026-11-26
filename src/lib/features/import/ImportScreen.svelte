<script lang="ts">
	import { onMount } from 'svelte';
	import type { ImportState } from '#lib/core/types.ts';
	import SkeletonCard from '#lib/components/SkeletonCard.svelte';
	import { t } from '#lib/i18n/index.svelte.ts';
	import DropZone from './DropZone.svelte';
	import ImportError from './ImportError.svelte';
	import MediaSummary from './MediaSummary.svelte';
	import { fetchMediaFromUrl, ImportFailure, loadMedia } from './load-media.ts';

	let importState = $state<ImportState>({ status: 'idle' });

	function releaseCurrent() {
		if (importState.status === 'ready') URL.revokeObjectURL(importState.media.objectUrl);
	}

	async function open(blob: Blob, name: string) {
		releaseCurrent();
		importState = { status: 'loading', name };
		try {
			importState = { status: 'ready', media: await loadMedia(blob, name) };
		} catch (error) {
			importState = {
				status: 'error',
				reason: error instanceof ImportFailure ? error.reason : 'decode-failed'
			};
		}
	}

	async function openUrl(url: string) {
		releaseCurrent();
		importState = { status: 'loading', name: url };
		try {
			const fetched = await fetchMediaFromUrl(url);
			await open(fetched.blob, fetched.name);
		} catch (error) {
			importState = {
				status: 'error',
				reason: error instanceof ImportFailure ? error.reason : 'fetch-failed'
			};
		}
	}

	function reset() {
		releaseCurrent();
		importState = { status: 'idle' };
	}

	onMount(() => {
		function onPaste(event: ClipboardEvent) {
			const target = event.target as HTMLElement | null;
			if (target?.closest('input, textarea')) return;
			const file = event.clipboardData?.files[0];
			if (!file) return;
			event.preventDefault();
			void open(file, file.name || 'clipboard');
		}
		window.addEventListener('paste', onPaste);
		return () => {
			window.removeEventListener('paste', onPaste);
			releaseCurrent();
		};
	});
</script>

<section aria-labelledby="import-title" class="flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<h1 id="import-title" class="text-2xl font-semibold tracking-tight sm:text-3xl">{t('importTitle')}</h1>
		<p class="max-w-[60ch] text-muted-foreground">{t('importDescription')}</p>
	</div>

	{#if importState.status === 'idle'}
		<DropZone onfile={open} onurl={openUrl} />
	{:else if importState.status === 'loading'}
		<SkeletonCard label="{t('importLoading')}: {importState.name}" />
	{:else if importState.status === 'ready'}
		<MediaSummary media={importState.media} onreplace={reset} />
	{:else}
		<ImportError reason={importState.reason} onretry={reset} />
	{/if}
</section>
