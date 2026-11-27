<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { newId } from '#lib/core/id.ts';
	import type { StickerKind } from '#lib/core/types.ts';
	import { formatBytes, PACK_MAX_STICKERS, PACK_MIN_STICKERS } from '#lib/core/whatsapp.ts';
	import { i18n, t } from '#lib/i18n/index.svelte.ts';
	import { pageHref } from '#lib/seo/links.ts';
	import {
		deletePack,
		deleteStickers,
		listPacks,
		listStickers,
		savePack,
		type LibraryPack,
		type LibrarySticker
	} from './db.ts';
	import { buildPack, PACK_TEXT_MAX, packFileName, packProblems } from './pack.ts';
	import { readSelection } from './selection.ts';

	const KINDS: readonly StickerKind[] = ['static', 'animated'];
	const TINTS = ['bg-tint-1', 'bg-tint-2', 'bg-tint-3', 'bg-tint-4', 'bg-tint-5'] as const;

	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let stickers = $state.raw<LibrarySticker[]>([]);
	let packs = $state.raw<LibraryPack[]>([]);
	let urls = $state.raw<Record<string, string>>({});
	let kind = $state<StickerKind>('static');
	let selected = $state<string[]>([]);
	let editingId = $state<string | null>(null);
	let name = $state('');
	let publisher = $state('');
	let showProblems = $state(false);
	let busy = $state(false);
	let notice = $state<'packSavedNotice' | 'packBuildFailed' | null>(null);
	let confirmSelected = $state(false);
	let confirmPack = $state<string | null>(null);
	let builder: HTMLElement | undefined = $state();
	let incoming: string[] = [];

	const visible = $derived(stickers.filter((item) => item.kind === kind));
	const chosen = $derived(
		selected.map((id) => stickers.find((item) => item.id === id)).filter((item) => item !== undefined)
	);
	const problems = $derived(packProblems({ name, publisher, stickers: chosen }));
	const counts = $derived({
		static: stickers.filter((item) => item.kind === 'static').length,
		animated: stickers.filter((item) => item.kind === 'animated').length
	});

	function releaseUrls() {
		for (const url of Object.values(urls)) URL.revokeObjectURL(url);
		urls = {};
	}

	async function load() {
		status = 'loading';
		try {
			const [nextStickers, nextPacks] = await Promise.all([listStickers(), listPacks()]);
			releaseUrls();
			urls = Object.fromEntries(nextStickers.map((item) => [item.id, URL.createObjectURL(item.webp)]));
			stickers = nextStickers;
			packs = nextPacks;
			const known = new Set(nextStickers.map((item) => item.id));
			selected = selected.filter((id) => known.has(id));
			if (counts[kind] === 0 && counts.animated > 0) kind = 'animated';
			status = 'ready';
			if (incoming.length > 0) await applyIncoming(nextStickers);
		} catch {
			status = 'error';
		}
	}

	async function applyIncoming(available: LibrarySticker[]) {
		const picked = incoming
			.map((id) => available.find((item) => item.id === id))
			.filter((item) => item !== undefined);
		incoming = [];
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- pageHref resolves through $app/paths
		replaceState(pageHref('library', i18n.locale), {});
		const first = picked[0];
		if (!first) return;
		kind = first.kind;
		editingId = null;
		selected = picked.filter((item) => item.kind === first.kind).map((item) => item.id);
		await tick();
		builder?.scrollIntoView({ block: 'start', behavior: 'smooth' });
	}

	function chooseKind(next: StickerKind) {
		if (next === kind) return;
		kind = next;
		selected = [];
		editingId = null;
		confirmSelected = false;
	}

	function toggle(id: string) {
		confirmSelected = false;
		notice = null;
		if (selected.includes(id)) selected = selected.filter((item) => item !== id);
		else if (selected.length < PACK_MAX_STICKERS) selected = [...selected, id];
	}

	function resetDraft() {
		editingId = null;
		selected = [];
		name = '';
		showProblems = false;
		notice = null;
	}

	function edit(pack: LibraryPack) {
		kind = pack.kind;
		editingId = pack.id;
		name = pack.name;
		publisher = pack.publisher;
		const known = new Set(stickers.map((item) => item.id));
		selected = pack.stickerIds.filter((id) => known.has(id));
		showProblems = false;
		notice = null;
		builder?.scrollIntoView({ block: 'start', behavior: 'smooth' });
	}

	async function persist(): Promise<boolean> {
		showProblems = true;
		if (problems.length > 0) return false;
		const id = editingId ?? newId();
		await savePack({
			id,
			name: name.trim(),
			publisher: publisher.trim(),
			kind,
			stickerIds: selected,
			updatedAt: 0
		});
		editingId = id;
		packs = await listPacks();
		return true;
	}

	async function save() {
		busy = true;
		notice = null;
		try {
			if (await persist()) notice = 'packSavedNotice';
		} catch {
			notice = 'packBuildFailed';
		} finally {
			busy = false;
		}
	}

	async function download() {
		busy = true;
		notice = null;
		try {
			if (!(await persist())) return;
			const blob = await buildPack(
				name,
				publisher,
				chosen.map((item) => item.webp)
			);
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = packFileName(name);
			link.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch {
			notice = 'packBuildFailed';
		} finally {
			busy = false;
		}
	}

	async function removePack(id: string) {
		if (confirmPack !== id) {
			confirmPack = id;
			return;
		}
		confirmPack = null;
		await deletePack(id);
		if (editingId === id) editingId = null;
		packs = await listPacks();
	}

	async function removeSelected() {
		if (!confirmSelected) {
			confirmSelected = true;
			return;
		}
		confirmSelected = false;
		await deleteStickers(selected);
		selected = [];
		await load();
	}

	onMount(() => {
		incoming = readSelection(location.search);
		void load();
		return releaseUrls;
	});
</script>

<section aria-labelledby="pack-title" class="mx-auto flex w-full max-w-4xl flex-col gap-6">
	<div class="flex flex-col gap-1">
		<h1 id="pack-title" class="text-3xl font-bold tracking-tight">{t('packTitle')}</h1>
		<p class="text-muted-foreground">{t('packIntro')}</p>
	</div>

	{#if status === 'loading'}
		<div role="status" aria-live="polite" class="grid grid-cols-3 gap-2 sm:grid-cols-5">
			<span class="sr-only">{t('packLoading')}</span>
			{#each Array.from({ length: 10 }, (_, index) => index) as index (index)}
				<div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
			{/each}
		</div>
	{:else if status === 'error'}
		<div role="alert" class="flex flex-col items-start gap-4 rounded-xl bg-destructive-soft p-5">
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
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-16 rounded-lg bg-tint-1 p-4 text-secondary-foreground"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 13 13 21H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5z" />
				<path d="M21 13h-5a3 3 0 0 0-3 3v5" />
			</svg>
			<h2 class="text-lg font-semibold">{t('packEmptyTitle')}</h2>
			<p class="max-w-sm text-sm text-muted-foreground">{t('packEmptyText')}</p>
			<a
				href={pageHref('home', i18n.locale)}
				class="flex min-h-11 items-center rounded-full bg-brand px-6 font-semibold shadow-soft"
			>
				{t('packEmptyCta')}
			</a>
		</div>
	{:else}
		{#if packs.length > 0}
			<section aria-labelledby="saved-packs" class="flex flex-col gap-3">
				<h2 id="saved-packs" class="text-lg font-semibold">{t('packSavedTitle')}</h2>
				<ul class="flex flex-col gap-2">
					{#each packs as pack (pack.id)}
						<li class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card p-4 shadow-soft">
							<div class="flex min-w-0 flex-col">
								<span class="truncate font-semibold">{pack.name}</span>
								<span class="tabular text-sm text-muted-foreground">
									{pack.publisher} · {pack.stickerIds.length}
									{t('packStickerCount')} · {pack.kind === 'static'
										? t('packKindStatic')
										: t('packKindAnimated')}
								</span>
							</div>
							<div class="flex gap-2">
								<button
									type="button"
									onclick={() => edit(pack)}
									class="min-h-11 rounded-full bg-muted px-4 text-sm font-semibold hover:bg-secondary"
								>
									{t('packEdit')}
								</button>
								<button
									type="button"
									onclick={() => removePack(pack.id)}
									class="min-h-11 rounded-full bg-destructive-soft px-4 text-sm font-semibold text-destructive"
								>
									{confirmPack === pack.id ? t('packDeleteConfirm') : t('packDelete')}
								</button>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section aria-labelledby="library-title" class="flex flex-col gap-3">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 id="library-title" class="text-lg font-semibold">{t('packLibrary')}</h2>
				<div role="group" aria-label={t('packKindHint')} class="flex gap-0.5 rounded-full bg-muted p-1">
					{#each KINDS as option (option)}
						<button
							type="button"
							aria-pressed={kind === option}
							onclick={() => chooseKind(option)}
							class="min-h-10 rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-soft"
						>
							{option === 'static' ? t('packKindStatic') : t('packKindAnimated')} · {counts[option]}
						</button>
					{/each}
				</div>
			</div>
			<p class="text-sm text-muted-foreground">{t('packSelectHint')} {t('packKindHint')}</p>
			{#if visible.length === 0}
				<p class="rounded-lg bg-card p-6 text-center text-sm text-muted-foreground shadow-soft">
					{t('packKindEmpty')}
				</p>
			{:else}
				<ul class="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
					{#each visible as item, index (item.id)}
						{@const order = selected.indexOf(item.id)}
						<li>
							<button
								type="button"
								aria-pressed={order >= 0}
								aria-label="{t('stickerItem')} {item.name} · {formatBytes(item.bytes)}"
								onclick={() => toggle(item.id)}
								class="relative block w-full rounded-lg p-2.5 transition-shadow duration-(--duration-fast) {TINTS[
									index % TINTS.length
								]} {order >= 0 ? 'ring-3 ring-primary ring-inset' : ''}"
							>
								<img
									src={urls[item.id]}
									alt=""
									width="512"
									height="512"
									class="aspect-square w-full object-contain"
								/>
								{#if order >= 0}
									<span
										class="tabular absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
									>
										{order + 1}
									</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
			{#if selected.length > 0}
				<button
					type="button"
					onclick={removeSelected}
					class="min-h-11 self-start rounded-full bg-destructive-soft px-4 text-sm font-semibold text-destructive"
				>
					{confirmSelected ? t('packDeleteSelectedConfirm') : t('packDeleteSelected')}
				</button>
			{/if}
		</section>

		<section
			bind:this={builder}
			aria-labelledby="builder-title"
			class="flex scroll-mt-20 flex-col gap-4 rounded-xl bg-card p-5 shadow-float sm:p-6"
		>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<h2 id="builder-title" class="text-lg font-semibold">
					{editingId ? name || t('packNew') : t('packNew')}
				</h2>
				<span class="tabular text-sm text-muted-foreground">
					{t('packSelected')}: {selected.length} / {PACK_MAX_STICKERS} · min {PACK_MIN_STICKERS}
				</span>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="flex flex-col gap-1 text-sm font-medium">
					{t('packName')}
					<input
						type="text"
						maxlength={PACK_TEXT_MAX}
						bind:value={name}
						autocomplete="off"
						aria-invalid={showProblems && problems.some((item) => item.startsWith('name'))}
						class="min-h-11 rounded-md border border-input bg-background px-3 text-base"
					/>
				</label>
				<label class="flex flex-col gap-1 text-sm font-medium">
					{t('packPublisher')}
					<input
						type="text"
						maxlength={PACK_TEXT_MAX}
						bind:value={publisher}
						autocomplete="nickname"
						aria-invalid={showProblems && problems.some((item) => item.startsWith('publisher'))}
						class="min-h-11 rounded-md border border-input bg-background px-3 text-base"
					/>
				</label>
			</div>
			<div class="flex items-center gap-3">
				<div class="size-12 shrink-0 overflow-hidden rounded-sm bg-muted">
					{#if chosen[0]}
						<img src={urls[chosen[0].id]} alt="" width="96" height="96" class="size-full object-contain" />
					{/if}
				</div>
				<div class="flex flex-col">
					<span class="text-sm font-medium">{t('packTray')}</span>
					<span class="text-xs text-muted-foreground">{t('packTrayHint')}</span>
				</div>
			</div>
			{#if showProblems && problems.length > 0}
				<ul role="alert" class="flex list-disc flex-col gap-1 pl-5 text-sm text-destructive">
					{#each problems as problem (problem)}
						<li>{t(`packProblem.${problem}`)}</li>
					{/each}
				</ul>
			{/if}
			<div role="status" class="text-sm">
				{#if busy}
					<span class="text-muted-foreground">{t('packBuilding')}</span>
				{:else if notice === 'packSavedNotice'}
					<span class="font-medium text-success">{t('packSavedNotice')}</span>
				{:else if notice}
					<span class="font-medium text-destructive">{t(notice)}</span>
				{/if}
			</div>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					disabled={busy}
					onclick={download}
					class="min-h-12 rounded-full bg-brand px-6 font-semibold shadow-soft disabled:opacity-60"
				>
					{t('packDownload')}
				</button>
				<button
					type="button"
					disabled={busy}
					onclick={save}
					class="min-h-12 rounded-full bg-muted px-5 font-semibold hover:bg-secondary disabled:opacity-60"
				>
					{t('packSave')}
				</button>
				{#if editingId || selected.length > 0}
					<button
						type="button"
						onclick={resetDraft}
						class="min-h-12 rounded-full bg-muted px-5 font-semibold hover:bg-secondary"
					>
						{t('packNew')}
					</button>
				{/if}
			</div>
			<p class="text-xs text-muted-foreground">{t('packHowTo')}</p>
		</section>
	{/if}
</section>
