<script lang="ts">
	let { label, lines = 3 }: { label: string; lines?: number } = $props();

	const widths = $derived(Array.from({ length: lines }, (_, index) => 85 - index * 15));
</script>

<div role="status" aria-live="polite" class="rounded-lg border bg-card p-4 sm:p-6">
	<span class="sr-only">{label}</span>
	<div class="flex flex-col gap-5 sm:flex-row">
		<div class="aspect-square w-full animate-pulse rounded-md bg-muted sm:w-56"></div>
		<div class="flex flex-1 flex-col gap-3">
			<div class="h-6 w-2/5 animate-pulse rounded-sm bg-muted"></div>
			{#each widths as width, index (index)}
				<div class="h-4 animate-pulse rounded-sm bg-muted" style="width: {width}%"></div>
			{/each}
		</div>
	</div>
</div>
