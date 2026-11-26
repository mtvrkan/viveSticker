<script lang="ts">
	import type { SourceMedia } from '#lib/core/types.ts';
	import EditorScreen from '#lib/features/editor/EditorScreen.svelte';
	import ImportScreen from '#lib/features/import/ImportScreen.svelte';
	import { saveSticker, StickerShelf } from '#lib/features/library/index.ts';
	import { t } from '#lib/i18n/index.svelte.ts';

	let editing = $state<SourceMedia | null>(null);
	const savedBlobs = new WeakSet<Blob>();

	async function keep(blob: Blob, kind: 'static' | 'animated', durationMs: number | null): Promise<boolean> {
		if (savedBlobs.has(blob)) return true;
		savedBlobs.add(blob);
		try {
			const name = editing?.name.replace(/\.[^.]+$/, '') || 'sticker';
			await saveSticker({ kind, webp: blob, durationMs, name });
			return true;
		} catch {
			savedBlobs.delete(blob);
			return false;
		}
	}

	function exitEditor() {
		if (editing) URL.revokeObjectURL(editing.objectUrl);
		editing = null;
	}

	function startNew() {
		const pick = document.getElementById('import-pick');
		if (pick) pick.click();
		else window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>viveSticker · {t('appTagline')}</title>
</svelte:head>

{#if editing}
	{#key editing.id}
		<EditorScreen media={editing} onexit={exitEditor} onfinish={keep} />
	{/key}
{:else}
	<div class="grid gap-8 lg:grid-cols-12 lg:items-start">
		<div class="lg:sticky lg:top-20 lg:col-span-5">
			<ImportScreen oncontinue={(media) => (editing = media)} />
		</div>
		<div class="lg:col-span-7">
			<StickerShelf onstart={startNew} />
		</div>
	</div>
{/if}
