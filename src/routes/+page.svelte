<script lang="ts">
	import ImportScreen from '#lib/features/import/ImportScreen.svelte';
	import { t } from '#lib/i18n/index.svelte.ts';
</script>

<svelte:head>
	<title>viveSticker · {t('appTagline')}</title>
</svelte:head>

<ImportScreen />
