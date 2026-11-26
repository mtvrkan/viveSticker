<script lang="ts">
	import { PackScreen } from '#lib/features/library/index.ts';
	import { t } from '#lib/i18n/index.svelte.ts';
</script>

<svelte:head>
	<title>{t('packTitle')} · viveSticker</title>
</svelte:head>

<PackScreen />
