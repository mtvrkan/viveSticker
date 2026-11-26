<script lang="ts">
	import type { MessageKey } from '#lib/i18n/tr.ts';
	import { t } from '#lib/i18n/index.svelte.ts';
	import { ASPECT_RATIOS, type AspectRatio, type PresetShape, type Shape } from './doc.ts';
	import type { EditorHistory } from './history.svelte.ts';
	import { LASSO_ICON, shapeIcon } from './icon-path.ts';

	let {
		history,
		drawing,
		lassoError,
		ondraw,
		oncanceldraw
	}: {
		history: EditorHistory;
		drawing: boolean;
		lassoError: boolean;
		ondraw: () => void;
		oncanceldraw: () => void;
	} = $props();

	type Option = {
		id: string;
		label: MessageKey;
		icon: string;
		select: () => void;
		active: (shape: Shape) => boolean;
	};

	let lastRect: Extract<Shape, { kind: 'rect' }> = { kind: 'rect', aspect: '1:1', corner: 0 };

	function setShape(shape: Shape) {
		history.apply({ ...history.doc, shape });
		if (drawing) oncanceldraw();
	}

	function preset(preset: PresetShape, label: MessageKey): Option {
		return {
			id: preset,
			label,
			icon: shapeIcon({ kind: 'preset', preset }),
			select: () => setShape({ kind: 'preset', preset }),
			active: (shape) => shape.kind === 'preset' && shape.preset === preset
		};
	}

	const options: Option[] = [
		{
			id: 'rect',
			label: 'shapeRect',
			icon: shapeIcon({ kind: 'rect', aspect: '1:1', corner: 0.2 }),
			select: () => setShape(history.doc.shape.kind === 'rect' ? history.doc.shape : { ...lastRect }),
			active: (shape) => shape.kind === 'rect'
		},
		{
			id: 'circle',
			label: 'shapeCircle',
			icon: shapeIcon({ kind: 'circle' }),
			select: () => setShape({ kind: 'circle' }),
			active: (shape) => shape.kind === 'circle'
		},
		preset('heart', 'shapeHeart'),
		preset('star', 'shapeStar'),
		preset('bubble', 'shapeBubble'),
		{
			id: 'lasso',
			label: 'shapeLasso',
			icon: LASSO_ICON,
			select: () => {
				if (history.doc.shape.kind !== 'lasso') ondraw();
			},
			active: (shape) => shape.kind === 'lasso'
		}
	];

	const rect = $derived(history.doc.shape.kind === 'rect' ? history.doc.shape : null);

	function isActive(option: Option): boolean {
		if (drawing) return option.id === 'lasso';
		return option.active(history.doc.shape);
	}

	function updateRect(patch: Partial<{ aspect: AspectRatio; corner: number }>, commit: boolean) {
		if (!rect) return;
		const next = { ...rect, ...patch };
		lastRect = next;
		if (commit) history.apply({ ...history.doc, shape: next });
		else history.preview({ ...history.doc, shape: next });
	}
</script>

<div class="flex flex-col gap-4">
	<div
		role="group"
		aria-label={t('tabShape')}
		class="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-3 lg:grid-cols-4"
	>
		{#each options as option (option.id)}
			<button
				type="button"
				aria-pressed={isActive(option)}
				onclick={option.select}
				class="flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border px-1 text-xs font-medium transition-colors duration-(--duration-fast)
					{isActive(option)
					? 'border-primary bg-secondary text-secondary-foreground'
					: 'border-input bg-card hover:bg-muted'}"
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					class="size-6"
					fill="none"
					stroke="currentColor"
					stroke-width="1.6"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d={option.icon} />
				</svg>
				{t(option.label)}
			</button>
		{/each}
	</div>

	{#if drawing}
		<div
			class="flex flex-col items-start gap-2 rounded-md bg-secondary p-3 text-sm text-secondary-foreground"
		>
			<p>{t('lassoHint')}</p>
			{#if lassoError}
				<p role="alert" class="font-medium text-destructive">{t('lassoTooSmall')}</p>
			{/if}
			<button
				type="button"
				onclick={oncanceldraw}
				class="min-h-11 rounded-md border border-input bg-card px-4 font-semibold text-foreground hover:bg-muted"
			>
				{t('lassoCancel')}
			</button>
		</div>
	{:else if history.doc.shape.kind === 'lasso'}
		<button
			type="button"
			onclick={ondraw}
			class="min-h-11 self-start rounded-md border border-input bg-card px-4 font-semibold hover:bg-muted"
		>
			{t('lassoRedraw')}
		</button>
	{:else if rect}
		<div class="flex flex-col gap-2">
			<p id="aspect-label" class="text-sm font-medium">{t('shapeAspect')}</p>
			<div role="group" aria-labelledby="aspect-label" class="flex flex-wrap gap-2">
				{#each ASPECT_RATIOS as aspect (aspect)}
					<button
						type="button"
						aria-pressed={rect.aspect === aspect}
						onclick={() => updateRect({ aspect }, true)}
						class="tabular min-h-11 min-w-14 rounded-md border px-3 text-sm transition-colors duration-(--duration-fast)
							{rect.aspect === aspect
							? 'border-primary bg-secondary text-secondary-foreground'
							: 'border-input bg-card hover:bg-muted'}"
					>
						{aspect}
					</button>
				{/each}
			</div>
		</div>
		<label class="flex flex-col gap-1 text-sm font-medium">
			<span class="flex justify-between">
				{t('shapeCorner')}
				<span class="tabular text-muted-foreground">{Math.round(rect.corner * 200)}%</span>
			</span>
			<input
				type="range"
				min="0"
				max="0.5"
				step="0.01"
				value={rect.corner}
				oninput={(event) => updateRect({ corner: event.currentTarget.valueAsNumber }, false)}
				onchange={(event) => updateRect({ corner: event.currentTarget.valueAsNumber }, true)}
				class="h-11 w-full accent-primary"
			/>
		</label>
	{/if}
</div>
