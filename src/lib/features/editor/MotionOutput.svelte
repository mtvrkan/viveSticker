<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { ANIMATED_MAX_BYTES } from '#lib/core/whatsapp.ts';
	import type { ClipRange, MotionSource } from '#lib/features/animate/index.ts';
	import { t } from '#lib/i18n/index.svelte.ts';
	import type { EditorDoc } from './doc.ts';
	import { FrameEncoderPool } from './encoder.ts';
	import type { EditorHistory } from './history.svelte.ts';
	import {
		BuildAborted,
		buildMotion,
		estimateMotion,
		type FrameRenderer,
		type MotionEstimate,
		type MotionResult
	} from './motion-build.ts';
	import SizeMeter from './SizeMeter.svelte';

	let {
		history,
		motion,
		range,
		paused,
		render,
		onbuilt,
		ondownload,
		onquality
	}: {
		history: EditorHistory;
		motion: MotionSource;
		range: ClipRange;
		paused: boolean;
		render: (doc: EditorDoc) => FrameRenderer;
		onbuilt: (blob: Blob, durationMs: number) => void;
		ondownload: (blob: Blob) => void;
		onquality: (quality: number) => void;
	} = $props();

	const ESTIMATE_DELAY_MS = 500;

	let pool: FrameEncoderPool | null = null;
	let estimate = $state<{ key: string; value: MotionEstimate } | null>(null);
	let result = $state<{ key: string; value: MotionResult } | null>(null);
	let estimating = $state(false);
	let building = $state(false);
	let progress = $state(0);
	let failed = $state(false);
	let buildController: AbortController | null = null;

	const key = $derived(JSON.stringify([history.doc, range.startMs, range.endMs, range.speed]));
	const built = $derived(result && result.key === key ? result.value : null);
	const shown = $derived<MotionEstimate | null>(
		built ?? (estimate && estimate.key === key ? estimate.value : null)
	);
	const detail = $derived.by(() => {
		if (!shown) return '';
		const mode = history.doc.quality.mode === 'auto' ? t('qualityAuto') : t('qualityManual');
		return `${mode} · ${t('meterQuality')} ${shown.candidate.quality} · ${shown.candidate.fps} fps · ${shown.frames} ${t('meterFrames')}`;
	});

	$effect(() => {
		if (shown) onquality(shown.candidate.quality);
	});

	function job(doc: EditorDoc, signal: AbortSignal, onprogress?: (value: number) => void) {
		return {
			motion,
			range: { ...range },
			render: render(doc),
			pool: pool as FrameEncoderPool,
			quality: doc.quality,
			limit: ANIMATED_MAX_BYTES,
			signal,
			onprogress
		};
	}

	$effect(() => {
		const current = key;
		if (paused) return;
		untrack(() => {
			buildController?.abort();
			estimating = true;
			failed = false;
		});
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			if (!pool) return;
			try {
				const value = await estimateMotion(job(JSON.parse(current)[0] as EditorDoc, controller.signal));
				if (controller.signal.aborted) return;
				estimate = { key: current, value };
			} catch (error) {
				if (!(error instanceof BuildAborted)) failed = true;
			} finally {
				if (!controller.signal.aborted) estimating = false;
			}
		}, ESTIMATE_DELAY_MS);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	async function build() {
		if (!pool || building) return;
		const current = key;
		const controller = new AbortController();
		buildController = controller;
		building = true;
		progress = 0;
		failed = false;
		try {
			const value = await buildMotion(
				job(JSON.parse(current)[0] as EditorDoc, controller.signal, (fraction) => (progress = fraction))
			);
			result = { key: current, value };
			onbuilt(value.blob, value.durationMs);
		} catch (error) {
			if (!(error instanceof BuildAborted)) failed = true;
		} finally {
			building = false;
			buildController = null;
		}
	}

	onMount(() => {
		pool = new FrameEncoderPool();
		return () => {
			buildController?.abort();
			pool?.dispose();
			pool = null;
		};
	});
</script>

<SizeMeter
	bytes={shown?.bytes ?? null}
	limit={ANIMATED_MAX_BYTES}
	fits={shown?.fits ?? null}
	working={(estimating && !built) || building}
	{failed}
	estimated={!built}
	durationMs={shown?.durationMs ?? null}
	{detail}
/>
{#if building}
	<div class="flex items-center gap-3">
		<div
			role="progressbar"
			aria-label={t('motionBuilding')}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={Math.round(progress * 100)}
			class="h-2 flex-1 overflow-hidden rounded-full bg-muted"
		>
			<div class="h-full rounded-full bg-primary" style="width: {Math.round(progress * 100)}%"></div>
		</div>
		<span class="tabular text-sm">{Math.round(progress * 100)}%</span>
		<button
			type="button"
			onclick={() => buildController?.abort()}
			class="min-h-11 rounded-full bg-muted px-4 text-sm font-semibold hover:bg-secondary"
		>
			{t('motionCancel')}
		</button>
	</div>
{:else if built}
	<button
		type="button"
		disabled={!built.fits}
		onclick={() => ondownload(built.blob)}
		class="min-h-12 rounded-full bg-brand px-5 font-semibold shadow-soft transition-transform duration-(--duration-fast) active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
	>
		{t('exportDownload')}
	</button>
{:else}
	<button
		type="button"
		disabled={paused}
		onclick={build}
		class="min-h-12 rounded-full bg-brand px-5 font-semibold shadow-soft transition-transform duration-(--duration-fast) active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
	>
		{t('motionBuild')}
	</button>
{/if}
