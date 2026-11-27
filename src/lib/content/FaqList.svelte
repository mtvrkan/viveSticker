<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import type { Faq } from './types.ts';

	let { faq, heading }: { faq: Faq[]; heading?: string } = $props();
</script>

{#if faq.length > 0}
	<section aria-labelledby="faq-title" class="flex flex-col gap-4">
		<h2 id="faq-title" class="text-xl font-bold tracking-tight">{heading ?? t('faqHeading')}</h2>
		<div class="flex flex-col gap-2">
			{#each faq as entry, index (index)}
				<details class="group rounded-lg bg-card shadow-soft">
					<summary
						class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden"
					>
						{entry.q}
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							class="size-5 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) group-open:rotate-45"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						>
							<path d="M12 5v14M5 12h14" />
						</svg>
					</summary>
					<p class="px-4 pb-4 leading-relaxed text-muted-foreground">{entry.a}</p>
				</details>
			{/each}
		</div>
	</section>
{/if}
