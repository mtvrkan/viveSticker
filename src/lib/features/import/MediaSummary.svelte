<script lang="ts">
	import type { SourceMedia } from '#lib/core/types.ts';
	import { ANIMATED_MAX_MS, formatBytes, formatSeconds } from '#lib/core/whatsapp.ts';
	import { t } from '#lib/i18n/index.svelte.ts';

	let { media, onreplace }: { media: SourceMedia; onreplace: () => void } = $props();

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

<article aria-labelledby="media-title" class="rounded-lg border bg-card p-4 sm:p-6">
	<div class="flex flex-col gap-5 sm:flex-row">
		<div
			class="checkerboard flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border sm:w-56"
		>
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

		<div class="flex min-w-0 flex-1 flex-col gap-4">
			<div class="flex flex-col gap-1">
				<p class="text-sm font-medium text-primary">{t('importReadyTitle')} · {kindLabel}</p>
				<h2 id="media-title" class="truncate text-lg font-semibold" title={media.name}>{media.name}</h2>
			</div>

			<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
				<dt class="text-muted-foreground">{t('metaSize')}</dt>
				<dd class="tabular">{formatBytes(media.bytes)}</dd>
				<dt class="text-muted-foreground">{t('metaResolution')}</dt>
				<dd class="tabular">{media.width}×{media.height}</dd>
				{#if media.durationMs !== null}
					<dt class="text-muted-foreground">{t('metaDuration')}</dt>
					<dd class="tabular {overLimit ? 'text-warning' : ''}">{formatSeconds(media.durationMs)}</dd>
				{/if}
				{#if media.frameCount !== null && media.frameCount > 1}
					<dt class="text-muted-foreground">{t('metaFrames')}</dt>
					<dd class="tabular">{media.frameCount}</dd>
				{/if}
				<dt class="text-muted-foreground">{t('metaTarget')}</dt>
				<dd>{animated ? t('targetAnimated') : t('targetStatic')}</dd>
			</dl>

			{#if overLimit}
				<p class="text-sm text-warning">{t('durationOverLimit')}</p>
			{/if}

			<div class="mt-auto flex flex-wrap gap-2">
				<button
					type="button"
					disabled
					aria-describedby="editor-soon"
					class="min-h-11 rounded-md bg-primary px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
				>
					{t('importContinue')}
				</button>
				<button
					type="button"
					onclick={onreplace}
					class="min-h-11 rounded-md border border-input px-4 font-semibold transition-colors duration-(--duration-fast) hover:bg-muted"
				>
					{t('importReplace')}
				</button>
			</div>
			<p id="editor-soon" class="text-xs text-muted-foreground">{t('importEditorSoon')}</p>
		</div>
	</div>
</article>
