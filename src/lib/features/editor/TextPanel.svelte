<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { FONT_IDS, itemId, TEXT_SIZE_MAX, TEXT_SIZE_MIN, type TextItem, type TextStroke } from './doc.ts';
	import { NUDGE_STEP_LARGE } from './geometry.ts';
	import type { EditorHistory } from './history.svelte.ts';
	import InkPicker from './InkPicker.svelte';
	import { FONT_STACKS } from './layers.ts';

	let {
		history,
		selectedId,
		onselect
	}: { history: EditorHistory; selectedId: string | null; onselect: (id: string | null) => void } = $props();

	const EMOJIS = ['😂', '❤️', '😍', '🔥', '👍', '😭', '🙏', '😎', '🎉', '💯', '😡', '🥳'];
	const STROKES: readonly TextStroke[] = ['none', 'light', 'dark'];

	const texts = $derived(history.doc.texts);
	const selected = $derived(texts.find((item) => item.id === selectedId) ?? null);
	const degrees = $derived(selected ? Math.round((selected.rotation * 180) / Math.PI) : 0);

	const nudges = [
		{ id: 'up', label: 'moveUp', dx: 0, dy: -1, icon: 'M12 19V5m-6 6 6-6 6 6' },
		{ id: 'left', label: 'moveLeft', dx: -1, dy: 0, icon: 'M19 12H5m6-6-6 6 6 6' },
		{ id: 'right', label: 'moveRight', dx: 1, dy: 0, icon: 'M5 12h14m-6-6 6 6-6 6' },
		{ id: 'down', label: 'moveDown', dx: 0, dy: 1, icon: 'M12 5v14m-6-6 6 6 6-6' }
	] as const;

	function add(item: Omit<TextItem, 'id'>) {
		const id = itemId();
		history.apply({ ...history.doc, texts: [...texts, { ...item, id }] });
		onselect(id);
	}

	function addText() {
		add({
			text: t('textDefault'),
			x: 0,
			y: 0.32,
			size: 0.14,
			rotation: 0,
			color: '#ffffff',
			font: 'display',
			stroke: 'dark'
		});
	}

	function addEmoji(emoji: string) {
		add({
			text: emoji,
			x: 0.28,
			y: -0.28,
			size: 0.2,
			rotation: 0,
			color: '#111111',
			font: 'sans',
			stroke: 'none'
		});
	}

	function update(patch: Partial<TextItem>, commit: boolean) {
		if (!selected) return;
		const id = selected.id;
		const next = {
			...history.doc,
			texts: texts.map((item) => (item.id === id ? { ...item, ...patch } : item))
		};
		if (commit) history.apply(next);
		else history.preview(next);
	}

	function remove() {
		if (!selected) return;
		const id = selected.id;
		history.apply({ ...history.doc, texts: texts.filter((item) => item.id !== id) });
		onselect(null);
	}

	function chip(active: boolean) {
		return active
			? 'border-primary bg-secondary text-secondary-foreground'
			: 'border-input bg-card hover:bg-muted';
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			onclick={addText}
			class="min-h-11 rounded-full bg-brand px-4 text-sm font-semibold shadow-soft"
		>
			+ {t('textAdd')}
		</button>
	</div>
	<div class="flex flex-col gap-2">
		<p id="emoji-label" class="text-sm font-medium">{t('emojiTitle')}</p>
		<div role="group" aria-labelledby="emoji-label" class="flex flex-wrap gap-2">
			{#each EMOJIS as emoji (emoji)}
				<button
					type="button"
					aria-label="{t('emojiTitle')} {emoji}"
					onclick={() => addEmoji(emoji)}
					class="flex size-11 items-center justify-center rounded-md border border-input bg-card text-2xl hover:bg-muted"
				>
					{emoji}
				</button>
			{/each}
		</div>
		<p class="text-xs text-muted-foreground">{t('emojiHint')}</p>
	</div>

	{#if texts.length === 0}
		<p class="text-sm text-muted-foreground">{t('textEmpty')}</p>
	{:else}
		<div class="flex flex-col gap-2">
			<p id="layers-label" class="text-sm font-medium">{t('textLayers')}</p>
			<div role="group" aria-labelledby="layers-label" class="flex flex-wrap gap-2">
				{#each texts as item (item.id)}
					<button
						type="button"
						aria-pressed={item.id === selectedId}
						onclick={() => onselect(item.id)}
						class="min-h-11 max-w-48 truncate rounded-md border px-3 text-sm {chip(item.id === selectedId)}"
					>
						{item.text.split('\n')[0] || '…'}
					</button>
				{/each}
			</div>
			<p class="text-xs text-muted-foreground">{t('textHint')}</p>
		</div>
	{/if}

	{#if selected}
		<div class="flex flex-col gap-4 border-t pt-4">
			<label class="flex flex-col gap-1 text-sm font-medium">
				{t('textContent')}
				<textarea
					rows="2"
					value={selected.text}
					oninput={(event) => update({ text: event.currentTarget.value }, false)}
					onchange={(event) => update({ text: event.currentTarget.value }, true)}
					class="rounded-md border border-input bg-card px-3 py-2 text-base"></textarea>
			</label>
			<div class="flex flex-col gap-2">
				<p id="font-label" class="text-sm font-medium">{t('textFont')}</p>
				<div
					role="group"
					aria-labelledby="font-label"
					class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2"
				>
					{#each FONT_IDS as font (font)}
						<button
							type="button"
							aria-pressed={selected.font === font}
							onclick={() => update({ font }, true)}
							style="font-family: {FONT_STACKS[font].family}; font-weight: {FONT_STACKS[font].weight}"
							class="min-h-11 rounded-md border px-3 text-base {chip(selected.font === font)}"
						>
							{t(`font.${font}`)}
						</button>
					{/each}
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<p class="text-sm font-medium">{t('textColor')}</p>
				<InkPicker
					label={t('textColor')}
					value={selected.color}
					onpick={(color) => update({ color }, true)}
				/>
			</div>
			<div class="flex flex-col gap-2">
				<p id="stroke-label" class="text-sm font-medium">{t('textStroke')}</p>
				<div role="group" aria-labelledby="stroke-label" class="flex flex-wrap gap-2">
					{#each STROKES as stroke (stroke)}
						<button
							type="button"
							aria-pressed={selected.stroke === stroke}
							onclick={() => update({ stroke }, true)}
							class="min-h-11 min-w-16 rounded-md border px-3 text-sm {chip(selected.stroke === stroke)}"
						>
							{t(`stroke.${stroke}`)}
						</button>
					{/each}
				</div>
			</div>
			<label class="flex flex-col gap-1 text-sm font-medium">
				<span class="flex justify-between">
					{t('textSize')}
					<span class="tabular text-muted-foreground">{Math.round(selected.size * 100)}%</span>
				</span>
				<input
					type="range"
					min={TEXT_SIZE_MIN}
					max={TEXT_SIZE_MAX}
					step="0.005"
					value={selected.size}
					oninput={(event) => update({ size: event.currentTarget.valueAsNumber }, false)}
					onchange={(event) => update({ size: event.currentTarget.valueAsNumber }, true)}
					class="h-11 w-full accent-primary"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium">
				<span class="flex justify-between">
					{t('textRotation')}
					<span class="tabular text-muted-foreground">{degrees}°</span>
				</span>
				<input
					type="range"
					min="-180"
					max="180"
					step="1"
					value={degrees}
					oninput={(event) =>
						update({ rotation: (event.currentTarget.valueAsNumber * Math.PI) / 180 }, false)}
					onchange={(event) =>
						update({ rotation: (event.currentTarget.valueAsNumber * Math.PI) / 180 }, true)}
					class="h-11 w-full accent-primary"
				/>
			</label>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div role="group" aria-label={t('textMove')} class="flex gap-2">
					{#each nudges as nudge (nudge.id)}
						<button
							type="button"
							aria-label="{t('textMove')}: {t(nudge.label)}"
							title={t(nudge.label)}
							onclick={() =>
								update(
									{
										x: selected.x + nudge.dx * NUDGE_STEP_LARGE,
										y: selected.y + nudge.dy * NUDGE_STEP_LARGE
									},
									true
								)}
							class="flex size-11 items-center justify-center rounded-md border border-input bg-card hover:bg-muted"
						>
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								class="size-5"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d={nudge.icon} />
							</svg>
						</button>
					{/each}
				</div>
				<button
					type="button"
					onclick={remove}
					class="min-h-11 rounded-md border border-destructive/40 bg-card px-4 text-sm font-semibold text-destructive hover:bg-destructive-soft"
				>
					{t('textDelete')}
				</button>
			</div>
		</div>
	{/if}
</div>
