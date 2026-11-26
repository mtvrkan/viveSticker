<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { INK_COLORS } from './doc.ts';

	let { label, value, onpick }: { label: string; value: string; onpick: (color: string) => void } = $props();
</script>

<div role="radiogroup" aria-label={label} class="flex flex-wrap gap-2">
	{#each INK_COLORS as ink (ink.id)}
		<button
			type="button"
			role="radio"
			aria-checked={value === ink.value}
			aria-label={t(`color.${ink.id}`)}
			title={t(`color.${ink.id}`)}
			onclick={() => onpick(ink.value)}
			class="flex size-11 items-center justify-center rounded-full border transition-colors duration-(--duration-fast)
				{value === ink.value ? 'border-primary bg-secondary' : 'border-input bg-card hover:bg-muted'}"
		>
			<span class="size-7 rounded-full border border-input" style="background-color: {ink.value}"></span>
		</button>
	{/each}
</div>
