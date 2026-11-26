<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { ImportState, SourceMedia } from '#lib/core/types.ts';
	import SkeletonCard from '#lib/components/SkeletonCard.svelte';
	import { t } from '#lib/i18n/index.svelte.ts';
	import { parseHttpUrl } from './classify.ts';
	import DropZone from './DropZone.svelte';
	import ImportError from './ImportError.svelte';
	import MediaSummary from './MediaSummary.svelte';
	import { fetchMediaFromUrl, ImportFailure, loadMedia } from './load-media.ts';
	import { hasSharedFile, takeSharedFile } from './shared-file.ts';

	let { oncontinue }: { oncontinue: (media: SourceMedia) => void } = $props();

	let importState = $state<ImportState>({ status: 'idle' });
	let ownedUrl: string | null = null;

	function releaseCurrent() {
		if (ownedUrl) URL.revokeObjectURL(ownedUrl);
		ownedUrl = null;
	}

	async function open(blob: Blob, name: string) {
		releaseCurrent();
		importState = { status: 'loading', name };
		try {
			const media = await loadMedia(blob, name);
			ownedUrl = media.objectUrl;
			importState = { status: 'ready', media };
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

	function handOff(media: SourceMedia) {
		ownedUrl = null;
		importState = { status: 'idle' };
		oncontinue(media);
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
			if (file) {
				event.preventDefault();
				void open(file, file.name || 'clipboard');
				return;
			}
			const text = event.clipboardData?.getData('text/plain').trim() ?? '';
			if (!parseHttpUrl(text)) return;
			event.preventDefault();
			void openUrl(text);
		}
		window.addEventListener('paste', onPaste);
		if (hasSharedFile(location.search)) {
			replaceState(resolve('/'), {});
			void takeSharedFile()
				.then((shared) => {
					if (shared) return open(shared.blob, shared.name);
				})
				.catch(() => undefined);
		}
		return () => {
			window.removeEventListener('paste', onPaste);
			releaseCurrent();
		};
	});
</script>

<section aria-labelledby="import-title" class="flex flex-col gap-4">
	{#if importState.status === 'idle'}
		<DropZone onfile={open} onurl={openUrl} />
	{:else}
		<h1 id="import-title" class="text-3xl font-bold tracking-tight">{t('importTitle')}</h1>
		{#if importState.status === 'loading'}
			<SkeletonCard label="{t('importLoading')}: {importState.name}" />
		{:else if importState.status === 'ready'}
			<MediaSummary media={importState.media} onreplace={reset} oncontinue={handOff} />
		{:else}
			<ImportError reason={importState.reason} onretry={reset} />
		{/if}
	{/if}
</section>
