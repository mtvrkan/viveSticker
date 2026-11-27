<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';

	let { items }: { items: { name: string; href: string }[] } = $props();
</script>

<nav aria-label={t('breadcrumbLabel')}>
	<ol class="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
		{#each items as item, index (item.href)}
			<li class="flex items-center gap-1">
				{#if index < items.length - 1}
					<a
						href={item.href}
						class="rounded-sm py-1 underline-offset-4 hover:text-foreground hover:underline"
					>
						{item.name}
					</a>
					<span aria-hidden="true">/</span>
				{:else}
					<span aria-current="page" class="py-1 font-medium text-foreground">{item.name}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
