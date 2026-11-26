<script lang="ts">
	import type { SourceMedia } from '#lib/core/types.ts';
	import { ANIMATED_MAX_MS, formatBytes, formatSeconds } from '#lib/core/whatsapp.ts';
	import { t } from '#lib/i18n/index.svelte.ts';

	let {
		media,
		onreplace,
		oncontinue
	}: { media: SourceMedia; onreplace: () => void; oncontinue: (media: SourceMedia) => void } = $props();

	const kindLabel = $derived(
		media.kind === 'video'
			? t('kindVideo')
			: media.kind === 'animated-image'
				? t('kindAnimated')
				: t('kindImage')
	);
	const animated = $derived(media.kind !== 'image');
	const overLimit = $derived(media.durationMs !== null && media.durationMs > ANIMATED_MAX_MS);
</script>

<article aria-labelledby="media-title" class="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-soft sm:p-5">
	<div class="checkerboard flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg">
		{#if media.kind === 'video'}
			<video
				src={media.objectUrl}
				class="max-h-full max-w-full object-contain"
				muted
				playsinline
				autoplay
				loop
				aria-label={media.name}
			></video>
		{:else}
			<img src={media.objectUrl} alt={media.name} class="max-h-full max-w-full object-contain" />
		{/if}
	</div>

	<div class="flex min-w-0 flex-col gap-1">
		<p class="text-sm font-semibold text-primary">{t('importReadyTitle')} · {kindLabel}</p>
		<h2 id="media-title" class="truncate text-lg font-semibold" title={media.name}>{media.name}</h2>
	</div>

	<dl class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
		<div class="rounded-sm bg-muted px-3 py-2">
			<dt class="text-xs text-muted-foreground">{t('metaSize')}</dt>
			<dd class="tabular font-medium">{formatBytes(media.bytes)}</dd>
		</div>
		<div class="rounded-sm bg-muted px-3 py-2">
			<dt class="text-xs text-muted-foreground">{t('metaResolution')}</dt>
			<dd class="tabular font-medium">{media.width}×{media.height}</dd>
		</div>
		{#if media.durationMs !== null}
			<div class="rounded-sm bg-muted px-3 py-2">
				<dt class="text-xs text-muted-foreground">{t('metaDuration')}</dt>
				<dd class="tabular font-medium {overLimit ? 'text-warning' : ''}">
					{formatSeconds(media.durationMs)}
				</dd>
			</div>
		{/if}
		{#if media.frameCount !== null && media.frameCount > 1}
			<div class="rounded-sm bg-muted px-3 py-2">
				<dt class="text-xs text-muted-foreground">{t('metaFrames')}</dt>
				<dd class="tabular font-medium">{media.frameCount}</dd>
			</div>
		{/if}
		<div class="col-span-2 rounded-sm bg-muted px-3 py-2 sm:col-span-1">
			<dt class="text-xs text-muted-foreground">{t('metaTarget')}</dt>
			<dd class="font-medium">{animated ? t('targetAnimated') : t('targetStatic')}</dd>
		</div>
	</dl>

	{#if overLimit}
		<p class="text-sm text-warning">{t('durationOverLimit')}</p>
	{/if}

	<div class="flex gap-2">
		<button
			type="button"
			onclick={() => oncontinue(media)}
			class="min-h-12 flex-1 rounded-full bg-brand px-5 font-semibold shadow-soft transition-transform duration-(--duration-fast) active:scale-98"
		>
			{t('importContinue')}
		</button>
		<button
			type="button"
			onclick={onreplace}
			class="min-h-12 rounded-full bg-muted px-5 font-semibold transition-colors duration-(--duration-fast) hover:bg-secondary"
		>
			{t('importReplace')}
		</button>
	</div>
</article>
