<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { coverTransform, MAX_SCALE, MIN_SCALE, type Transform } from './doc.ts';
	import { NUDGE_STEP_LARGE, normalizeAngle, pan, rotateAround } from './geometry.ts';
	import type { EditorHistory } from './history.svelte.ts';

	let { history, width, height }: { history: EditorHistory; width: number; height: number } = $props();

	const transform = $derived(history.doc.transform);
	const degrees = $derived(Math.round((transform.rotation * 180) / Math.PI));

	function setTransform(next: Transform, commit: boolean) {
		if (commit) history.apply({ ...history.doc, transform: next });
		else history.preview({ ...history.doc, transform: next });
	}

	function zoomTo(value: number, commit: boolean) {
		const scale = 2 ** value;
		const factor = scale / transform.scale;
		setTransform({ ...transform, scale, x: transform.x * factor, y: transform.y * factor }, commit);
	}

	function rotateTo(value: number, commit: boolean) {
		setTransform(rotateAround(transform, (value * Math.PI) / 180 - transform.rotation), commit);
	}

	const actions = [
		{ id: 'fit', label: 'adjustFit', run: () => ({ x: 0, y: 0, scale: 1, rotation: transform.rotation }) },
		{ id: 'fill', label: 'adjustFill', run: () => coverTransform(width, height, transform.rotation) },
		{ id: 'center', label: 'adjustCenter', run: () => ({ ...transform, x: 0, y: 0 }) },
		{
			id: 'rotate',
			label: 'adjustRotate90',
			run: () => {
				const next = rotateAround(transform, Math.PI / 2);
				return {
					...next,
					rotation: normalizeAngle(Math.round(next.rotation / (Math.PI / 2)) * (Math.PI / 2))
				};
			}
		}
	] as const;

	const nudges = [
		{ id: 'up', label: 'moveUp', dx: 0, dy: -1, icon: 'M12 19V5m-6 6 6-6 6 6' },
		{ id: 'left', label: 'moveLeft', dx: -1, dy: 0, icon: 'M19 12H5m6-6-6 6 6 6' },
		{ id: 'right', label: 'moveRight', dx: 1, dy: 0, icon: 'M5 12h14m-6-6 6 6-6 6' },
		{ id: 'down', label: 'moveDown', dx: 0, dy: 1, icon: 'M12 5v14m-6-6 6 6 6-6' }
	] as const;
</script>

<div class="flex flex-col gap-4">
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2">
		{#each actions as action (action.id)}
			<button
				type="button"
				onclick={() => setTransform(action.run(), true)}
				class="min-h-11 rounded-md border border-input bg-card px-3 text-sm font-semibold transition-colors duration-(--duration-fast) hover:bg-muted"
			>
				{t(action.label)}
			</button>
		{/each}
	</div>
	<div class="flex flex-col gap-2">
		<p id="move-label" class="text-sm font-medium">{t('adjustMove')}</p>
		<div role="group" aria-labelledby="move-label" class="flex gap-2">
			{#each nudges as nudge (nudge.id)}
				<button
					type="button"
					aria-label={t(nudge.label)}
					title={t(nudge.label)}
					onclick={() =>
						setTransform(pan(transform, nudge.dx * NUDGE_STEP_LARGE, nudge.dy * NUDGE_STEP_LARGE), true)}
					class="flex size-11 items-center justify-center rounded-md border border-input bg-card transition-colors duration-(--duration-fast) hover:bg-muted"
				>
					<svg
						aria-hidden="true"
						viewBox="0 0 24 24"
						class="size-5"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d={nudge.icon} />
					</svg>
				</button>
			{/each}
		</div>
	</div>
	<label class="flex flex-col gap-1 text-sm font-medium">
		<span class="flex justify-between">
			{t('adjustZoom')}
			<span class="tabular text-muted-foreground">{Math.round(transform.scale * 100)}%</span>
		</span>
		<input
			type="range"
			min={Math.log2(MIN_SCALE)}
			max={Math.log2(MAX_SCALE)}
			step="0.01"
			value={Math.log2(transform.scale)}
			oninput={(event) => zoomTo(event.currentTarget.valueAsNumber, false)}
			onchange={(event) => zoomTo(event.currentTarget.valueAsNumber, true)}
			class="h-11 w-full accent-primary"
		/>
	</label>
	<label class="flex flex-col gap-1 text-sm font-medium">
		<span class="flex justify-between">
			{t('adjustRotation')}
			<span class="tabular text-muted-foreground">{degrees}°</span>
		</span>
		<input
			type="range"
			min="-180"
			max="180"
			step="1"
			value={degrees}
			oninput={(event) => rotateTo(event.currentTarget.valueAsNumber, false)}
			onchange={(event) => rotateTo(event.currentTarget.valueAsNumber, true)}
			class="h-11 w-full accent-primary"
		/>
	</label>
	<label class="flex min-h-11 items-start gap-3 text-sm">
		<input
			type="checkbox"
			checked={history.doc.margin}
			onchange={(event) => history.apply({ ...history.doc, margin: event.currentTarget.checked })}
			class="mt-0.5 size-5 accent-primary"
		/>
		<span class="flex flex-col">
			<span class="font-medium">{t('adjustMargin')}</span>
			<span class="text-muted-foreground">{t('adjustMarginHint')}</span>
		</span>
	</label>
</div>
