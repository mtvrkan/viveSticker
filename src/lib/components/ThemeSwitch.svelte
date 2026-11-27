<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { chooseTheme, theme } from './theme.svelte.ts';

	// Each switch on the page needs its own radio group name.
	let { name = 'theme' }: { name?: string } = $props();

	const options = $derived([
		{ id: 'system' as const, label: t('themeSystem') },
		{ id: 'light' as const, label: t('themeLight') },
		{ id: 'dark' as const, label: t('themeDark') }
	]);
</script>

<fieldset class="flex items-center gap-2">
	<legend class="sr-only">{t('themeLabel')}</legend>
	<span aria-hidden="true" class="text-sm text-muted-foreground">{t('themeLabel')}</span>
	<div class="flex gap-0.5 rounded-full bg-muted p-1">
		{#each options as option (option.id)}
			<label
				class="flex min-h-9 cursor-pointer items-center rounded-full px-3 text-sm font-semibold text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground has-checked:bg-card has-checked:text-foreground has-checked:shadow-soft has-focus-visible:outline-2 has-focus-visible:outline-ring"
			>
				<input
					type="radio"
					{name}
					value={option.id}
					checked={theme.choice === option.id}
					onchange={() => chooseTheme(option.id)}
					class="sr-only"
				/>
				{option.label}
			</label>
		{/each}
	</div>
</fieldset>
