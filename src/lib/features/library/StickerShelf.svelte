<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { StickerKind } from '#lib/core/types.ts';
	import { PACK_MAX_STICKERS } from '#lib/core/whatsapp.ts';
	import { t } from '#lib/i18n/index.svelte.ts';
	import { listStickers, type LibrarySticker } from './db.ts';
	import { selectionQuery } from './selection.ts';

	let { onstart }: { onstart: () => void } = $props();

	type Filter = 'all' | StickerKind;
	const FILTERS: readonly Filter[] = ['all', 'static', 'animated'];
	const TINTS = ['bg-tint-1', 'bg-tint-2', 'bg-tint-3', 'bg-tint-4', 'bg-tint-5'] as const;

	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let stickers = $state.raw<LibrarySticker[]>([]);
	let urls = $state.raw<Record<string, string>>({});
	let filter = $state<Filter>('all');
	let selected = $state<string[]>([]);

	const visible = $derived(filter === 'all' ? stickers : stickers.filter((item) => item.kind === filter));
	const counts = $derived({
		all: stickers.length,
		static: stickers.filter((item) => item.kind === 'static').length,
		animated: stickers.filter((item) => item.kind === 'animated').length
	});
	const selectedKind = $derived(stickers.find((item) => item.id === selected[0])?.kind ?? null);

	function filterLabel(option: Filter): string {
		if (option === 'all') return t('shelfAll');
		return option === 'static' ? t('packKindStatic') : t('packKindAnimated');
	}

	function toggle(item: LibrarySticker) {
		if (selected.includes(item.id)) selected = selected.filter((id) => id !== item.id);
		else if (selectedKind && selectedKind !== item.kind) selected = [item.id];
		else if (selected.length < PACK_MAX_STICKERS) selected = [...selected, item.id];
	}

	function release() {
		for (const url of Object.values(urls)) URL.revokeObjectURL(url);
		urls = {};
	}

	async function load() {
		status = 'loading';
		try {
			const next = await listStickers();
			release();
			urls = Object.fromEntries(next.map((item) => [item.id, URL.createObjectURL(item.webp)]));
			stickers = next;
			status = 'ready';
		} catch {
			status = 'error';
		}
	}

	onMount(() => {
		void load();
		return release;
	});
</script>

<section aria-labelledby="shelf-title" class="flex flex-col gap-4 {selected.length > 0 ? 'pb-24' : ''}">
	<div class="flex flex-wrap items-center gap-3">
		<h2 id="shelf-title" class="mr-auto text-2xl font-bold tracking-tight">{t('shelfTitle')}</h2>
		{#if status === 'ready' && stickers.length > 0}
			<div role="group" aria-label={t('shelfFilter')} class="flex gap-0.5 rounded-full bg-muted p-1">
				{#each FILTERS as option (option)}
					<button
						type="button"
						aria-pressed={filter === option}
						onclick={() => (filter = option)}
						class="flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-soft"
					>
						{filterLabel(option)}
						<span class="tabular text-xs">{counts[option]}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if status === 'loading'}
		<div role="status" aria-live="polite" class="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
			<span class="sr-only">{t('packLoading')}</span>
			{#each Array.from({ length: 6 }, (_, index) => index) as index (index)}
				<div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
			{/each}
		</div>
	{:else if status === 'error'}
		<div role="alert" class="flex flex-col items-start gap-4 rounded-lg bg-destructive-soft p-5">
			<p class="text-sm">{t('packLoadFailed')}</p>
			<button
				type="button"
				onclick={load}
				class="min-h-11 rounded-full bg-foreground px-5 font-semibold text-background"
			>
				{t('packRetry')}
			</button>
		</div>
	{:else if stickers.length === 0}
		<div class="flex flex-col items-center gap-3 rounded-xl bg-card px-6 py-12 text-center shadow-soft">
			<div class="flex size-16 items-center justify-center rounded-lg bg-tint-1 text-secondary-foreground">
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					class="size-8"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 13 13 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5z" />
					<path d="M21 13h-5a3 3 0 0 0-3 3v5" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold">{t('packEmptyTitle')}</h3>
			<p class="max-w-sm text-sm text-muted-foreground">{t('shelfEmptyText')}</p>
			<button
				type="button"
				onclick={onstart}
				class="min-h-11 rounded-full bg-brand px-6 font-semibold shadow-soft transition-transform duration-(--duration-fast) active:scale-98"
			>
				{t('packEmptyCta')}
			</button>
		</div>
	{:else}
		<p class="-mt-2 text-sm text-muted-foreground">{t('shelfHint')} {t('packKindHint')}</p>
		<ul class="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
			{#each visible as item, index (item.id)}
				{@const order = selected.indexOf(item.id)}
				<li>
					<button
						type="button"
						aria-pressed={order >= 0}
						aria-label="{t('stickerItem')} {item.name} · {item.kind === 'static'
							? t('packKindStatic')
							: t('packKindAnimated')}"
						onclick={() => toggle(item)}
						class="relative block w-full rounded-lg p-3 transition-[opacity,box-shadow,transform] duration-(--duration-fast) active:scale-98 {TINTS[
							index % TINTS.length
						]} {order >= 0 ? 'ring-3 ring-primary ring-inset' : ''} {selectedKind &&
						selectedKind !== item.kind
							? 'opacity-50'
							: ''}"
					>
						<img
							src={urls[item.id]}
							alt=""
							width="512"
							height="512"
							loading="lazy"
							class="aspect-square w-full object-contain"
						/>
						{#if item.kind === 'animated'}
							<span
								aria-hidden="true"
								class="absolute bottom-2 left-2 flex size-6 items-center justify-center rounded-full bg-foreground/80 text-background"
							>
								<svg viewBox="0 0 24 24" class="size-3" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
							</span>
						{/if}
						<span
							aria-hidden="true"
							class="tabular absolute top-2 right-2 flex size-6 items-center justify-center rounded-full border-2 text-xs font-semibold
								{order >= 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/25 bg-card/85'}"
						>
							{order >= 0 ? order + 1 : ''}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if selected.length > 0}
	<div
		class="fixed inset-x-3 bottom-4 z-40 mb-[env(safe-area-inset-bottom)] flex items-center gap-1 rounded-full bg-foreground py-2 pr-2 pl-5 text-background shadow-float sm:inset-x-auto sm:left-1/2 sm:w-md sm:-translate-x-1/2"
	>
		<p role="status" class="mr-auto font-semibold">
			<span class="tabular">{selected.length}</span>
			{t('shelfSelected')}
		</p>
		<button
			type="button"
			onclick={() => (selected = [])}
			class="min-h-11 rounded-full px-4 font-semibold text-background/80 transition-colors duration-(--duration-fast) hover:text-background"
		>
			{t('shelfCancel')}
		</button>
		<a
			href="{resolve('/pack')}{selectionQuery(selected)}"
			class="flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 font-semibold"
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-4.5"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="m4 7 8-4 8 4-8 4-8-4zM4 12l8 4 8-4M4 17l8 4 8-4" />
			</svg>
			{t('shelfMakePack')}
		</a>
	</div>
{/if}
