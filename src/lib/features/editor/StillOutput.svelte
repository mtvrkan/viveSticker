<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { STATIC_MAX_BYTES } from '#lib/core/whatsapp.ts';
	import { t } from '#lib/i18n/index.svelte.ts';
	import type { EditorDoc } from './doc.ts';
	import { StickerEncoder, type EncodeResult } from './encoder.ts';
	import type { EditorHistory } from './history.svelte.ts';
	import type { SourceImage } from './render.ts';
	import SizeMeter from './SizeMeter.svelte';

	let {
		history,
		source,
		paused,
		render,
		ondownload,
		onquality
	}: {
		history: EditorHistory;
		source: SourceImage;
		paused: boolean;
		render: (source: SourceImage, doc: EditorDoc) => Promise<ImageData>;
		ondownload: (blob: Blob, kind: 'static', durationMs: null) => void;
		onquality: (quality: number) => void;
	} = $props();

	const ENCODE_DELAY_MS = 250;

	let result = $state<{ key: string; value: EncodeResult } | null>(null);
	let encoding = $state(false);
	let failed = $state(false);
	let encoder: StickerEncoder | null = null;

	const docKey = $derived(JSON.stringify(history.doc));
	const current = $derived(result && result.key === docKey ? result.value : null);
	const shown = $derived(current ?? result?.value ?? null);
	const ready = $derived(current !== null && current.fits && !encoding && !paused);
	const detail = $derived.by(() => {
		if (!shown) return '';
		const mode = history.doc.quality.mode === 'auto' ? t('qualityAuto') : t('qualityManual');
		const level = shown.lossless ? t('meterLossless') : `${t('meterQuality')} ${shown.quality}`;
		return `${mode} · ${level} · 512×512 WebP`;
	});

	$effect(() => {
		if (shown) onquality(shown.lossless ? 100 : shown.quality);
	});

	$effect(() => {
		const key = docKey;
		const image = source;
		if (paused) return;
		untrack(() => {
			encoding = true;
			failed = false;
		});
		const timer = setTimeout(async () => {
			if (!encoder) return;
			const doc = JSON.parse(key) as EditorDoc;
			try {
				const value = await encoder.encode(await render(image, doc), doc.quality, STATIC_MAX_BYTES);
				if (!value || key !== docKey) return;
				result = { key, value };
				encoding = false;
			} catch {
				failed = true;
				encoding = false;
			}
		}, ENCODE_DELAY_MS);
		return () => clearTimeout(timer);
	});

	onMount(() => {
		encoder = new StickerEncoder();
		return () => {
			encoder?.dispose();
			encoder = null;
		};
	});
</script>

<SizeMeter
	bytes={shown?.size ?? null}
	limit={STATIC_MAX_BYTES}
	fits={shown?.fits ?? null}
	working={encoding}
	{failed}
	{detail}
/>
<button
	type="button"
	disabled={!ready}
	onclick={() => current && ondownload(current.blob, 'static', null)}
	class="min-h-12 rounded-full bg-brand px-5 font-semibold shadow-soft transition-transform duration-(--duration-fast) active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
>
	{t('exportDownload')}
</button>
