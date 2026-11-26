<script lang="ts">
	import {
		clampRange,
		defaultRange,
		outputDuration,
		SPEEDS,
		type ClipRange
	} from '#lib/features/animate/index.ts';
	import { i18n, t } from '#lib/i18n/index.svelte.ts';

	let {
		durationMs,
		ranges,
		selectedId,
		playing,
		currentMs,
		onchange,
		onplay,
		onpause,
		onscrub
	}: {
		durationMs: number;
		ranges: ClipRange[];
		selectedId: string;
		playing: boolean;
		currentMs: number;
		onchange: (ranges: ClipRange[], selectedId: string) => void;
		onplay: () => void;
		onpause: () => void;
		onscrub: (ms: number) => void;
	} = $props();

	const STEP_MS = 10;

	const selected = $derived(ranges.find((range) => range.id === selectedId) ?? (ranges[0] as ClipRange));
	const format = $derived(
		new Intl.NumberFormat(i18n.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
	);

	function seconds(ms: number): string {
		return `${format.format(ms / 1000)} s`;
	}

	function percent(ms: number): number {
		return durationMs > 0 ? (ms / durationMs) * 100 : 0;
	}

	function update(next: ClipRange, scrubTo?: number) {
		onchange(
			ranges.map((range) => (range.id === next.id ? next : range)),
			next.id
		);
		if (scrubTo !== undefined) onscrub(scrubTo);
	}

	function setStart(value: number) {
		const next = clampRange({ ...selected, startMs: value }, durationMs, 'end');
		update(next, next.startMs);
	}

	function setEnd(value: number) {
		const next = clampRange({ ...selected, endMs: value }, durationMs, 'start');
		update(next, Math.max(next.startMs, next.endMs - 1));
	}

	function setSpeed(speed: number) {
		update(clampRange({ ...selected, speed }, durationMs, 'start'));
	}

	function addRange() {
		const next = defaultRange(durationMs, ranges.at(-1));
		onchange([...ranges, next], next.id);
		onscrub(next.startMs);
	}

	function removeRange(id: string) {
		if (ranges.length < 2) return;
		const rest = ranges.filter((range) => range.id !== id);
		const next = rest[0] as ClipRange;
		onchange(rest, next.id);
		onscrub(next.startMs);
	}

	function selectRange(range: ClipRange) {
		onchange(ranges, range.id);
		onscrub(range.startMs);
	}
</script>

<div class="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-soft">
	<div class="flex items-center gap-3">
		<button
			type="button"
			aria-label={playing ? t('motionPause') : t('motionPlay')}
			title={playing ? t('motionPause') : t('motionPlay')}
			onclick={() => (playing ? onpause() : onplay())}
			class="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand transition-opacity duration-(--duration-fast) hover:opacity-90"
		>
			<svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="currentColor">
				{#if playing}
					<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
				{:else}
					<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
				{/if}
			</svg>
		</button>
		<div class="relative h-11 flex-1">
			<div class="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted"></div>
			<div
				class="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-brand-tint"
				style="left: {percent(selected.startMs)}%; width: {percent(selected.endMs - selected.startMs)}%"
			></div>
			<div
				class="absolute top-1 bottom-1 w-0.5 rounded-full bg-primary"
				style="left: {percent(currentMs)}%"
				aria-hidden="true"
			></div>
			<input
				type="range"
				aria-label={t('motionStart')}
				aria-valuetext={seconds(selected.startMs)}
				min="0"
				max={durationMs}
				step={STEP_MS}
				value={selected.startMs}
				oninput={(event) => setStart(event.currentTarget.valueAsNumber)}
				class="dual-range absolute inset-0 w-full"
			/>
			<input
				type="range"
				aria-label={t('motionEnd')}
				aria-valuetext={seconds(selected.endMs)}
				min="0"
				max={durationMs}
				step={STEP_MS}
				value={selected.endMs}
				oninput={(event) => setEnd(event.currentTarget.valueAsNumber)}
				class="dual-range absolute inset-0 w-full"
			/>
		</div>
	</div>
	<div class="tabular flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
		<span>{seconds(selected.startMs)} – {seconds(selected.endMs)}</span>
		<span>{t('motionOutput')}: {seconds(outputDuration(selected))}</span>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<span id="speed-label" class="text-sm font-medium">{t('motionSpeed')}</span>
		<div role="group" aria-labelledby="speed-label" class="flex flex-wrap gap-1.5">
			{#each SPEEDS as speed (speed)}
				<button
					type="button"
					aria-pressed={selected.speed === speed}
					onclick={() => setSpeed(speed)}
					class="tabular min-h-11 min-w-12 rounded-md border px-2 text-sm transition-colors duration-(--duration-fast)
						{selected.speed === speed
						? 'border-primary bg-secondary text-secondary-foreground'
						: 'border-input bg-card hover:bg-muted'}"
				>
					{speed}×
				</button>
			{/each}
		</div>
	</div>
	<div class="flex flex-col gap-2">
		<span id="ranges-label" class="text-sm font-medium">{t('motionRanges')}</span>
		<div role="group" aria-labelledby="ranges-label" class="flex flex-wrap gap-2">
			{#each ranges as range, index (range.id)}
				<div
					class="flex items-center rounded-md border {range.id === selected.id
						? 'border-primary bg-secondary'
						: 'border-input bg-card'}"
				>
					<button
						type="button"
						aria-pressed={range.id === selected.id}
						onclick={() => selectRange(range)}
						class="tabular min-h-11 px-3 text-sm"
					>
						{index + 1} · {seconds(range.startMs)}–{seconds(range.endMs)}
					</button>
					{#if ranges.length > 1}
						<button
							type="button"
							aria-label="{t('motionRemoveRange')} {index + 1}"
							title="{t('motionRemoveRange')} {index + 1}"
							onclick={() => removeRange(range.id)}
							class="flex size-11 items-center justify-center text-muted-foreground hover:text-destructive"
						>
							<svg
								aria-hidden="true"
								viewBox="0 0 24 24"
								class="size-4"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							>
								<path d="M6 6l12 12M18 6 6 18" />
							</svg>
						</button>
					{/if}
				</div>
			{/each}
			<button
				type="button"
				onclick={addRange}
				class="min-h-11 rounded-md border border-dashed border-input px-3 text-sm font-semibold hover:bg-muted"
			>
				+ {t('motionAddRange')}
			</button>
		</div>
		<p class="text-xs text-muted-foreground">{t('motionRangesHint')}</p>
	</div>
</div>
