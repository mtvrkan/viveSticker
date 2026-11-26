<script lang="ts">
	let { label, lines = 3 }: { label: string; lines?: number } = $props();

	const widths = $derived(Array.from({ length: lines }, (_, index) => 85 - index * 15));
</script>

<div role="status" aria-live="polite" class="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-soft sm:p-5">
	<span class="sr-only">{label}</span>
	<div class="aspect-square w-full animate-pulse rounded-lg bg-muted"></div>
	<div class="h-6 w-2/5 animate-pulse rounded-sm bg-muted"></div>
	{#each widths as width, index (index)}
		<div class="h-4 animate-pulse rounded-sm bg-muted" style="width: {width}%"></div>
	{/each}
</div>
