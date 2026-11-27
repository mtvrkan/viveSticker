<script lang="ts">
	import { i18n } from '#lib/i18n/index.svelte.ts';
	import FaqList from './FaqList.svelte';
	import { copyFor } from './index.ts';
	import RelatedLinks from './RelatedLinks.svelte';
	import SectionBlock from './SectionBlock.svelte';

	const home = $derived(copyFor(i18n.locale).home);
	const tints = ['bg-tint-1', 'bg-tint-2', 'bg-tint-3', 'bg-tint-4', 'bg-tint-5', 'bg-tint-1'];
</script>

<div class="mt-16 flex flex-col gap-14">
	<div class="max-w-3xl">
		<SectionBlock section={home.intro} />
	</div>

	<section aria-labelledby="steps-title" class="flex flex-col gap-4">
		<h2 id="steps-title" class="text-xl font-bold tracking-tight">{home.stepsHeading}</h2>
		<ol class="grid gap-3 md:grid-cols-3">
			{#each home.steps as step, index (step.title)}
				<li class="flex flex-col gap-2 rounded-xl bg-card p-5 shadow-soft">
					<span
						aria-hidden="true"
						class="tabular flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold"
					>
						{index + 1}
					</span>
					<h3 class="font-semibold">{step.title}</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
				</li>
			{/each}
		</ol>
	</section>

	<section aria-labelledby="features-title" class="flex flex-col gap-4">
		<h2 id="features-title" class="text-xl font-bold tracking-tight">{home.featuresHeading}</h2>
		<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each home.features as feature, index (feature.title)}
				<li class="flex flex-col gap-1 rounded-xl p-5 {tints[index % tints.length]}">
					<h3 class="font-semibold">{feature.title}</h3>
					<p class="text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
				</li>
			{/each}
		</ul>
	</section>

	<div class="max-w-3xl">
		<FaqList faq={home.faq} />
	</div>

	<RelatedLinks ids={home.guides} heading={home.guidesHeading} headingId="guides-title" />
</div>
