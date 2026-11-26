<script lang="ts">
	import { ANIMATED_MAX_MS } from '#lib/core/whatsapp.ts';
	import { i18n, t } from '#lib/i18n/index.svelte.ts';

	let {
		bytes,
		limit,
		fits,
		working,
		failed,
		estimated = false,
		detail,
		durationMs = null
	}: {
		bytes: number | null;
		limit: number;
		fits: boolean | null;
		working: boolean;
		failed: boolean;
		estimated?: boolean;
		detail: string;
		durationMs?: number | null;
	} = $props();

	const kb = $derived(
		new Intl.NumberFormat(i18n.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
	);
	const seconds = $derived(
		new Intl.NumberFormat(i18n.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
	);
	const limitKb = $derived(limit / 1024);
	const percent = $derived(bytes === null ? 0 : Math.min(100, (bytes / limit) * 100));
	const over = $derived(fits === false);
</script>

<div class="flex flex-col gap-2" aria-busy={working}>
	<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
		<p
			class="tabular text-2xl font-semibold transition-opacity duration-(--duration-base) {working
				? 'opacity-50'
				: ''}"
		>
			<span class="sr-only">{t('meterLabel')}: </span>
			{#if estimated && bytes !== null}<span class="text-muted-foreground">≈</span>{/if}
			<span>{bytes === null ? '—' : kb.format(bytes / 1024)}</span>
			<span class="text-muted-foreground"> / {limitKb} KB</span>
			{#if durationMs !== null}
				<span class="text-muted-foreground"> · </span>
				<span>{seconds.format(durationMs / 1000)}</span>
				<span class="text-muted-foreground"> / {ANIMATED_MAX_MS / 1000} s</span>
			{/if}
		</p>
		<p role="status" class="text-sm font-medium {failed || over ? 'text-destructive' : 'text-success'}">
			{#if failed}
				{t('meterFailed')}
			{:else if working}
				<span class="text-muted-foreground">{t('meterWorking')}</span>
			{:else if fits !== null}
				{fits ? (estimated ? t('meterEstimateFits') : t('meterFits')) : t('meterOver')}
			{/if}
		</p>
	</div>
	<div class="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
		<div
			class="h-full rounded-full transition-[width,background-color] duration-(--duration-base) ease-(--ease-enter) {over
				? 'bg-destructive'
				: 'bg-success'}"
			style="width: {percent}%"
		></div>
	</div>
	<p class="tabular text-xs text-muted-foreground">{detail}</p>
</div>
