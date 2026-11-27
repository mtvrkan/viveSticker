<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import SkeletonCard from '#lib/components/SkeletonCard.svelte';
	import type { SourceMedia } from '#lib/core/types.ts';
	import ImportScreen from '#lib/features/import/ImportScreen.svelte';
	import { saveSticker, StickerShelf } from '#lib/features/library/index.ts';
	import { t } from '#lib/i18n/index.svelte.ts';

	type EditorComponent = (typeof import('#lib/features/editor/EditorScreen.svelte'))['default'];

	interface Props {
		/** Level of the import heading: the home page leads with it, guide pages demote it. */
		heading?: 'h1' | 'h2';
		/** Home shows the saved stickers beside the import card; guide pages show their intro instead. */
		shelf?: boolean;
		/** Rendered beside the import card when `shelf` is off. Hidden while editing. */
		lead?: Snippet;
		/** Rendered under the tool. Hidden while editing so the editor stays the only screen. */
		after?: Snippet;
	}

	let { heading = 'h1', shelf = true, lead, after }: Props = $props();

	let editing = $state<SourceMedia | null>(null);
	let Editor = $state<EditorComponent | null>(null);
	let editorFailed = $state(false);
	let loading: Promise<void> | null = null;
	const savedBlobs = new WeakSet<Blob>();

	// The editor (canvas tools, encoders, extra fonts) is the heaviest part of the app, so it is
	// split out of the first paint and fetched while the visitor is still choosing a file.
	function loadEditor() {
		if (Editor || loading) return;
		editorFailed = false;
		loading = import('#lib/features/editor/EditorScreen.svelte')
			.then((module) => {
				Editor = module.default;
			})
			.catch(() => {
				editorFailed = true;
			})
			.finally(() => {
				loading = null;
			});
	}

	onMount(() => {
		if ('requestIdleCallback' in window) {
			const handle = requestIdleCallback(loadEditor, { timeout: 3000 });
			return () => cancelIdleCallback(handle);
		}
		const handle = setTimeout(loadEditor, 1500);
		return () => clearTimeout(handle);
	});

	function startEditing(media: SourceMedia) {
		editing = media;
		loadEditor();
	}

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

{#if editing}
	{#if Editor}
		{#key editing.id}
			<Editor media={editing} onexit={exitEditor} onfinish={keep} />
		{/key}
	{:else if editorFailed}
		<div
			role="alert"
			class="mx-auto flex max-w-md flex-col items-start gap-4 rounded-xl bg-destructive-soft p-5"
		>
			<p class="text-sm">{t('editorLoadFailed')}</p>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					onclick={loadEditor}
					class="flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary-hover"
				>
					{t('editorRetry')}
				</button>
				<button
					type="button"
					onclick={exitEditor}
					class="flex min-h-11 items-center rounded-full bg-card px-5 text-sm font-semibold shadow-soft transition-colors duration-(--duration-fast) hover:bg-muted"
				>
					{t('editorBack')}
				</button>
			</div>
		</div>
	{:else}
		<div class="mx-auto max-w-md">
			<SkeletonCard label={t('editorChunkLoading')} lines={2} />
		</div>
	{/if}
{:else}
	<div class="grid gap-8 lg:grid-cols-12 lg:items-start">
		{#if shelf}
			<div class="lg:sticky lg:top-20 lg:col-span-5">
				<ImportScreen oncontinue={startEditing} {heading} />
			</div>
			<div class="lg:col-span-7">
				<StickerShelf onstart={startNew} />
			</div>
		{:else}
			<div class="lg:col-span-7 lg:pt-6">
				{@render lead?.()}
			</div>
			<div class="lg:col-span-5">
				<ImportScreen oncontinue={startEditing} {heading} />
			</div>
		{/if}
	</div>
	{@render after?.()}
{/if}
