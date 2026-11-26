<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { OUTLINE_MAX } from './doc.ts';
	import type { EditorHistory } from './history.svelte.ts';
	import InkPicker from './InkPicker.svelte';

	let {
		history,
		animated,
		picking,
		status,
		ontogglepick
	}: {
		history: EditorHistory;
		animated: boolean;
		picking: boolean;
		status: 'idle' | 'loading' | 'working' | 'failed';
		ontogglepick: () => void;
	} = $props();

	const cutout = $derived(history.doc.cutout);
	const outline = $derived(history.doc.outline);
	const points = $derived(cutout.mode === 'object' ? cutout.points : []);

	function undoPoint() {
		const rest = points.slice(0, -1);
		history.apply({
			...history.doc,
			cutout: rest.length ? { mode: 'object', points: rest } : { mode: 'none' }
		});
	}

	function setOutline(patch: Partial<typeof outline>, commit: boolean) {
		const next = { ...history.doc, outline: { ...outline, ...patch } };
		if (commit) history.apply(next);
		else history.preview(next);
	}
</script>

<div class="flex flex-col gap-5">
	<div class="flex flex-col gap-3">
		{#if animated}
			<label class="flex min-h-11 items-center gap-3 text-sm font-medium">
				<input
					type="checkbox"
					checked={cutout.mode === 'person'}
					onchange={(event) =>
						history.apply({
							...history.doc,
							cutout: event.currentTarget.checked ? { mode: 'person' } : { mode: 'none' }
						})}
					class="size-5 accent-primary"
				/>
				{t('cutoutPerson')}
			</label>
			<p class="text-sm text-muted-foreground">{t('cutoutPersonHint')}</p>
		{:else}
			<p class="text-sm text-muted-foreground">{t('cutoutObjectHint')}</p>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					aria-pressed={picking}
					onclick={ontogglepick}
					class="min-h-11 rounded-md border px-4 text-sm font-semibold transition-colors duration-(--duration-fast)
						{picking ? 'border-primary bg-secondary text-secondary-foreground' : 'border-input bg-card hover:bg-muted'}"
				>
					{picking ? t('cutoutPickDone') : t('cutoutPick')}
				</button>
				<button
					type="button"
					disabled={points.length === 0}
					onclick={undoPoint}
					class="min-h-11 rounded-md border border-input bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
				>
					{t('cutoutUndoPoint')}
				</button>
				<button
					type="button"
					disabled={cutout.mode === 'none'}
					onclick={() => history.apply({ ...history.doc, cutout: { mode: 'none' } })}
					class="min-h-11 rounded-md border border-input bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
				>
					{t('cutoutReset')}
				</button>
			</div>
			{#if points.length > 0}
				<p class="tabular text-sm text-muted-foreground">{t('cutoutPoints')}: {points.length}</p>
			{/if}
		{/if}
		<div role="status" class="text-sm">
			{#if status === 'loading'}
				<span class="text-muted-foreground">{t('cutoutLoading')}</span>
			{:else if status === 'working'}
				<span class="text-muted-foreground">{t('cutoutWorking')}</span>
			{:else if status === 'failed'}
				<span class="font-medium text-destructive">{t('cutoutFailed')}</span>
			{/if}
		</div>
	</div>

	<div class="flex flex-col gap-3 border-t pt-4">
		<p class="text-sm font-semibold">{t('outlineTitle')}</p>
		<label class="flex flex-col gap-1 text-sm font-medium">
			<span class="flex justify-between">
				{t('outlineWidth')}
				<span class="tabular text-muted-foreground">{outline.width} px</span>
			</span>
			<input
				type="range"
				min="0"
				max={OUTLINE_MAX}
				step="1"
				value={outline.width}
				oninput={(event) => setOutline({ width: event.currentTarget.valueAsNumber }, false)}
				onchange={(event) => setOutline({ width: event.currentTarget.valueAsNumber }, true)}
				class="h-11 w-full accent-primary"
			/>
		</label>
		<InkPicker
			label={t('outlineColor')}
			value={outline.color}
			onpick={(color) => setOutline({ color }, true)}
		/>
	</div>
</div>
