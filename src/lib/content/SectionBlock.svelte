<script lang="ts">
	import type { Section } from './types.ts';

	let { section }: { section: Section } = $props();
</script>

<section class="flex flex-col gap-3">
	<h2 class="text-xl font-bold tracking-tight">{section.heading}</h2>
	{#each section.paragraphs as paragraph, index (index)}
		<p class="leading-relaxed text-muted-foreground">{paragraph}</p>
	{/each}
	{#if section.bullets}
		<ul class="flex flex-col gap-2">
			{#each section.bullets as bullet, index (index)}
				<li class="flex gap-3 leading-relaxed">
					<span aria-hidden="true" class="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"></span>
					<span>{bullet}</span>
				</li>
			{/each}
		</ul>
	{/if}
	{#if section.steps}
		<ol class="flex flex-col gap-3">
			{#each section.steps as step, index (index)}
				<li class="flex gap-3 leading-relaxed">
					<span
						aria-hidden="true"
						class="tabular flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
					>
						{index + 1}
					</span>
					<span class="pt-0.5">{step}</span>
				</li>
			{/each}
		</ol>
	{/if}
</section>
