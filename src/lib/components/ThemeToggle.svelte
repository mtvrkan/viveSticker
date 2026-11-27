<script lang="ts">
	import { t } from '#lib/i18n/index.svelte.ts';
	import { hydration } from './hydration.svelte.ts';
	import Icon from './Icon.svelte';
	import { isDark, toggleTheme } from './theme.svelte.ts';

	let { class: className = '' }: { class?: string } = $props();
</script>

<!-- The icon follows the applied theme through CSS, so it is right before hydration too. -->
<button
	type="button"
	aria-pressed={isDark()}
	disabled={!hydration.done}
	onclick={toggleTheme}
	class="size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-soft transition-colors duration-(--duration-fast) hover:bg-muted {className}"
>
	<span class="sr-only">{t('themeDarkToggle')}</span>
	<Icon name="moon" class="size-5 dark:hidden" />
	<Icon name="sun" class="hidden size-5 dark:block" />
</button>
