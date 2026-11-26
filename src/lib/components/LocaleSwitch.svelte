<script lang="ts">
	import { i18n, setLocale, t, type Locale } from '#lib/i18n/index.svelte.ts';

	const options: { value: Locale; label: string }[] = [
		{ value: 'tr', label: 'TR' },
		{ value: 'en', label: 'EN' }
	];
</script>

<div role="group" aria-label={t('languageLabel')} class="flex rounded-md border bg-card p-0.5">
	{#each options as option (option.value)}
		<button
			type="button"
			aria-pressed={i18n.locale === option.value}
			onclick={() => setLocale(option.value)}
			class="min-h-10 min-w-11 rounded-sm px-2 text-sm font-semibold transition-colors duration-(--duration-fast)
				{i18n.locale === option.value
				? 'bg-foreground text-background'
				: 'text-muted-foreground hover:text-foreground'}"
		>
			{option.label}
		</button>
	{/each}
</div>
