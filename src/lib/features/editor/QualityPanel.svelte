<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { MANUAL_QUALITY_MAX, MANUAL_QUALITY_MIN, type QualityMode } from './doc.ts';
	import type { EditorHistory } from './history.svelte.ts';

	let { history, suggested }: { history: EditorHistory; suggested: number } = $props();

	const quality = $derived(history.doc.quality);

	function setQuality(next: QualityMode, commit: boolean) {
		if (commit) history.apply({ ...history.doc, quality: next });
		else history.preview({ ...history.doc, quality: next });
	}

	const modes = [
		{ id: 'auto', label: 'qualityAuto' },
		{ id: 'manual', label: 'qualityManual' }
	] as const;
</script>

<div class="flex flex-col gap-4">
	<div role="group" aria-label={t('exportQuality')} class="flex rounded-md border bg-card p-0.5">
		{#each modes as mode (mode.id)}
			<button
				type="button"
				aria-pressed={quality.mode === mode.id}
				onclick={() =>
					setQuality(mode.id === 'auto' ? { mode: 'auto' } : { mode: 'manual', quality: suggested }, true)}
				class="min-h-10 flex-1 rounded-sm px-3 text-sm font-semibold transition-colors duration-(--duration-fast)
					{quality.mode === mode.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}"
			>
				{t(mode.label)}
			</button>
		{/each}
	</div>
	{#if quality.mode === 'manual'}
		<label class="flex flex-col gap-1 text-sm font-medium">
			<span class="flex justify-between">
				{t('qualityLevel')}
				<span class="tabular text-muted-foreground">{quality.quality}</span>
			</span>
			<input
				type="range"
				min={MANUAL_QUALITY_MIN}
				max={MANUAL_QUALITY_MAX}
				step="1"
				value={quality.quality}
				oninput={(event) => setQuality({ mode: 'manual', quality: event.currentTarget.valueAsNumber }, false)}
				onchange={(event) => setQuality({ mode: 'manual', quality: event.currentTarget.valueAsNumber }, true)}
				class="h-11 w-full accent-primary"
			/>
		</label>
	{:else}
		<p class="text-sm text-muted-foreground">{t('qualityAutoHint')}</p>
	{/if}
</div>
