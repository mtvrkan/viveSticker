<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { BRUSH_MAX, BRUSH_MIN } from './doc.ts';
	import type { EditorHistory } from './history.svelte.ts';
	import InkPicker from './InkPicker.svelte';

	let {
		history,
		active,
		color,
		width,
		ontoggle,
		onchange
	}: {
		history: EditorHistory;
		active: boolean;
		color: string;
		width: number;
		ontoggle: () => void;
		onchange: (patch: { color?: string; width?: number }) => void;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap gap-2">
		<button
			type="button"
			aria-pressed={active}
			onclick={ontoggle}
			class="min-h-11 rounded-md border px-4 text-sm font-semibold transition-colors duration-(--duration-fast)
				{active ? 'border-primary bg-secondary text-secondary-foreground' : 'border-input bg-card hover:bg-muted'}"
		>
			{active ? t('drawStop') : t('drawStart')}
		</button>
		<button
			type="button"
			disabled={history.doc.strokes.length === 0}
			onclick={() => history.apply({ ...history.doc, strokes: [] })}
			class="min-h-11 rounded-md border border-input bg-card px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
		>
			{t('drawClear')}
		</button>
	</div>
	{#if active}
		<p class="text-sm text-muted-foreground">{t('drawHint')}</p>
	{/if}
	<InkPicker label={t('drawColor')} value={color} onpick={(next) => onchange({ color: next })} />
	<label class="flex flex-col gap-1 text-sm font-medium">
		<span class="flex justify-between">
			{t('drawWidth')}
			<span class="tabular text-muted-foreground">{width} px</span>
		</span>
		<input
			type="range"
			min={BRUSH_MIN}
			max={BRUSH_MAX}
			step="1"
			value={width}
			oninput={(event) => onchange({ width: event.currentTarget.valueAsNumber })}
			class="h-11 w-full accent-primary"
		/>
	</label>
</div>
