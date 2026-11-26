<script lang="ts">
	import { i18n, setLocale, t } from '#lib/i18n/index.svelte.ts';

	const next = $derived(i18n.locale === 'tr' ? 'en' : 'tr');
</script>

<button
	type="button"
	lang={next}
	onclick={() => setLocale(next)}
	class="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-sm font-bold shadow-soft transition-colors duration-(--duration-fast) hover:bg-muted"
>
	<span class="sr-only">{t('languageLabel')}: </span>{next.toUpperCase()}
</button>
