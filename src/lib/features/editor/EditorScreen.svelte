<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount, untrack } from 'svelte';
	import SkeletonCard from '#lib/components/SkeletonCard.svelte';
	import type { SourceMedia } from '#lib/core/types.ts';
	import { STICKER_SIZE } from '#lib/core/whatsapp.ts';
	import type { ObjectCutter, PersonCutter } from '#lib/features/cutout/index.ts';
	import {
		MotionFailure,
		MotionPlayer,
		openMotion,
		type ClipRange,
		type MotionFrame,
		type MotionSource
	} from '#lib/features/animate/index.ts';
	import { t } from '#lib/i18n/index.svelte.ts';
	import type { MessageKey } from '#lib/i18n/tr.ts';
	import AdjustPanel from './AdjustPanel.svelte';
	import CutoutPanel from './CutoutPanel.svelte';
	import { createDoc, INK_COLORS, OBJECT_POINTS_MAX, type EditorDoc, type Point } from './doc.ts';
	import DrawPanel from './DrawPanel.svelte';
	import EditorCanvas from './EditorCanvas.svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import { finishLasso, fitPoints, keyTransform } from './geometry.ts';
	import { EditorHistory } from './history.svelte.ts';
	import MotionControls from './MotionControls.svelte';
	import MotionOutput from './MotionOutput.svelte';
	import { ensureFonts } from './layers.ts';
	import { initialRange } from './motion-range.ts';
	import QualityPanel from './QualityPanel.svelte';
	import { decodeSource, renderStickerPixels, SourceImage } from './render.ts';
	import ShapePanel from './ShapePanel.svelte';
	import StillOutput from './StillOutput.svelte';
	import TextPanel from './TextPanel.svelte';
	import type { CanvasTool } from './tools.ts';

	let {
		media,
		onexit,
		onfinish
	}: {
		media: SourceMedia;
		onexit: () => void;
		onfinish: (blob: Blob, kind: 'static' | 'animated', durationMs: number | null) => Promise<boolean>;
	} = $props();

	type Tab = 'shape' | 'adjust' | 'cutout' | 'text' | 'draw' | 'quality';
	const tabs: { id: Tab; label: MessageKey; icon: string }[] = [
		{
			id: 'shape',
			label: 'tabShape',
			icon: 'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z'
		},
		{
			id: 'adjust',
			label: 'tabAdjust',
			icon: 'M12 3v18M3 12h18M12 3 9 6M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3'
		},
		{ id: 'cutout', label: 'tabCutout', icon: 'M4 20 14 10M15 3v3M19.5 5.5l-2 2M21 10h-3M12.5 6.5 14 8' },
		{ id: 'text', label: 'tabText', icon: 'M5 7V5h14v2M12 5v14M9 19h6' },
		{ id: 'draw', label: 'tabDraw', icon: 'm4 20 4-1L19 8l-3-3L5 16l-1 4z' },
		{ id: 'quality', label: 'exportQuality', icon: 'M4 17a8 8 0 1 1 16 0M12 17l4-5' }
	];
	const OBJECT_INPUT = 1024;
	const STROKE_MIN_STEP = 0.003;
	type CutoutModule = typeof import('#lib/features/cutout/index.ts');

	const history = new EditorHistory(createDoc());
	let source = $state<SourceImage | null>(null);
	let loadError = $state<MessageKey | null>(null);
	let drawing = $state(false);
	let lassoError = $state(false);
	let compare = $state(false);
	let tab = $state<Tab>('shape');
	let suggested = $state(85);
	let stage: HTMLDivElement | undefined = $state();
	let picking = $state(false);
	let saved = $state(false);
	let brushOn = $state(false);
	let brushColor = $state<string>(INK_COLORS[2].value);
	let brushWidth = $state(10);
	let selectedText = $state<string | null>(null);
	let mask = $state.raw<SourceImage | null>(null);
	let cutoutStatus = $state<'idle' | 'loading' | 'working' | 'failed'>('idle');
	let cutoutModule: Promise<CutoutModule> | null = null;
	let objectCutter: ObjectCutter | null = null;
	let personCutter: PersonCutter | null = null;
	let lastFrame: MotionFrame | null = null;
	let maskToken = 0;

	const tool = $derived<CanvasTool>(
		drawing
			? 'lasso'
			: tab === 'cutout' && picking && media.kind === 'image'
				? 'pick'
				: tab === 'draw' && brushOn
					? 'brush'
					: 'move'
	);
	const cutoutKey = $derived(JSON.stringify(history.doc.cutout));
	let videoHost: HTMLDivElement;

	let motion = $state<MotionSource | null>(null);
	let player: MotionPlayer | null = null;
	let ranges = $state<ClipRange[]>([]);
	let selectedId = $state('');
	let playing = $state(false);
	let currentMs = $state(0);

	const range = $derived(ranges.find((item) => item.id === selectedId) ?? ranges[0] ?? null);
	const rangeIndex = $derived(range ? ranges.indexOf(range) : 0);

	function startDrawing() {
		pause();
		drawing = true;
		lassoError = false;
		tab = 'shape';
		stage?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

	function cancelDrawing() {
		drawing = false;
		lassoError = false;
	}

	function completeLasso(points: Point[], tolerance: number) {
		const finished = finishLasso(points, tolerance);
		if (!finished) {
			lassoError = true;
			return;
		}
		const doc = history.doc;
		history.apply({
			...doc,
			shape: { kind: 'lasso', points: finished },
			transform: fitPoints(finished, doc.transform.rotation) ?? doc.transform
		});
		cancelDrawing();
	}

	function fileName(suffix: string): string {
		const base = media.name
			.replace(/\.[^.]+$/, '')
			.replace(/[^\p{L}\p{N}_-]+/gu, '-')
			.slice(0, 60);
		return `${base || 'sticker'}${suffix}-sticker.webp`;
	}

	async function finish(blob: Blob, kind: 'static' | 'animated', durationMs: number | null) {
		if (await onfinish(blob, kind, durationMs)) saved = true;
	}

	function save(blob: Blob, name: string) {
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = name;
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	function onTabKey(event: KeyboardEvent, index: number) {
		const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
		const offset = offsets[event.key];
		if (offset === undefined) return;
		event.preventDefault();
		const next = tabs[(index + offset + tabs.length) % tabs.length];
		if (!next) return;
		tab = next.id;
		document.getElementById(`tab-${next.id}`)?.focus();
	}

	function loadCutout(): Promise<CutoutModule> {
		cutoutModule ??= import('#lib/features/cutout/index.ts');
		cutoutModule.catch(() => (cutoutModule = null));
		return cutoutModule;
	}

	async function ensurePerson(): Promise<PersonCutter> {
		personCutter ??= await (await loadCutout()).PersonCutter.create();
		return personCutter;
	}

	function personMask(cutter: PersonCutter, frame: MotionFrame): SourceImage | null {
		const canvas = cutter.mask(frame.image, frame.width, frame.height);
		return canvas ? new SourceImage(canvas, frame.width, frame.height) : null;
	}

	async function objectMask(image: SourceImage, doc: EditorDoc): Promise<SourceImage | null> {
		if (doc.cutout.mode !== 'object') return null;
		const module = await loadCutout();
		objectCutter ??= new module.ObjectCutter(image.toCanvas(OBJECT_INPUT));
		const long = image.long;
		const canvas = await objectCutter.mask(
			doc.cutout.points.map((p) => ({
				x: Math.min(1, Math.max(0, (p.x * long + image.width / 2) / image.width)),
				y: Math.min(1, Math.max(0, (p.y * long + image.height / 2) / image.height))
			}))
		);
		return canvas ? new SourceImage(canvas, image.width, image.height) : null;
	}

	async function refreshMask() {
		const token = ++maskToken;
		const doc = history.doc;
		if (doc.cutout.mode === 'none') {
			mask = null;
			cutoutStatus = 'idle';
			return;
		}
		try {
			if (doc.cutout.mode === 'object') {
				if (!source) return;
				cutoutStatus = objectCutter ? 'working' : 'loading';
				const next = await objectMask(source, doc);
				if (token !== maskToken) return;
				mask = next;
			} else {
				cutoutStatus = personCutter ? 'working' : 'loading';
				const cutter = await ensurePerson();
				if (token !== maskToken) return;
				mask = lastFrame ? personMask(cutter, lastFrame) : null;
			}
			cutoutStatus = 'idle';
		} catch {
			if (token !== maskToken) return;
			mask = null;
			cutoutStatus = 'failed';
		}
	}

	$effect(() => {
		void cutoutKey;
		untrack(() => void refreshMask());
	});

	$effect(() => {
		void ensureFonts(history.doc.texts);
	});

	function addCutoutPoint(point: Point) {
		if (!source) return;
		const doc = history.doc;
		const points = doc.cutout.mode === 'object' ? doc.cutout.points : [];
		const halfW = source.width / source.long / 2;
		const halfH = source.height / source.long / 2;
		if (points.length >= OBJECT_POINTS_MAX || Math.abs(point.x) > halfW || Math.abs(point.y) > halfH) return;
		history.apply({ ...doc, cutout: { mode: 'object', points: [...points, point] } });
	}

	function addStroke(points: Point[]) {
		const kept: Point[] = [];
		for (const point of points) {
			const previous = kept[kept.length - 1];
			if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) >= STROKE_MIN_STEP)
				kept.push(point);
		}
		const last = points[points.length - 1];
		if (last && kept[kept.length - 1] !== last && kept.length > 1) kept.push(last);
		if (kept.length === 0) return;
		const doc = history.doc;
		history.apply({
			...doc,
			strokes: [...doc.strokes, { color: brushColor, width: brushWidth / STICKER_SIZE, points: kept }]
		});
	}

	async function renderStill(image: SourceImage, doc: EditorDoc): Promise<ImageData> {
		const [extra] = await Promise.all([objectMask(image, doc), ensureFonts(doc.texts)]);
		return renderStickerPixels(image, doc, { mask: extra });
	}

	function renderMotion(doc: EditorDoc) {
		return async (frame: MotionFrame) => {
			await ensureFonts(doc.texts);
			const cutter = doc.cutout.mode === 'person' ? await ensurePerson() : null;
			return renderStickerPixels(new SourceImage(frame.image, frame.width, frame.height), doc, {
				mask: cutter ? personMask(cutter, frame) : null
			});
		};
	}

	function showFrame(frame: MotionFrame, ms: number) {
		lastFrame = frame;
		if (history.doc.cutout.mode === 'person' && personCutter) mask = personMask(personCutter, frame);
		source = new SourceImage(frame.image, frame.width, frame.height);
		currentMs = ms;
	}

	async function play() {
		if (!player || drawing) return;
		await player.play();
		playing = player.playing;
	}

	function pause() {
		player?.pause();
		playing = false;
	}

	function scrub(ms: number) {
		playing = false;
		void player?.seek(ms);
	}

	function changeRanges(next: ClipRange[], id: string) {
		ranges = next;
		selectedId = id;
	}

	$effect(() => {
		if (range) player?.setRange({ ...range });
	});

	async function loadMotion(cancelled: () => boolean) {
		const opened = await openMotion(media);
		if (cancelled()) {
			opened.dispose();
			return;
		}
		const first = initialRange(opened.durationMs);
		ranges = [first];
		selectedId = first.id;
		motion = opened;
		player = new MotionPlayer(opened, showFrame);
		await player.attach(videoHost);
		player.setRange(first);
		await player.seek(first.startMs);
		await play();
	}

	onMount(() => {
		let cancelled = false;
		const isCancelled = () => cancelled;
		const load =
			media.kind === 'image'
				? decodeSource(media.blob).then((decoded) => {
						if (!cancelled) source = decoded;
					})
				: loadMotion(isCancelled);
		load.catch((error: unknown) => {
			if (cancelled) return;
			loadError =
				error instanceof MotionFailure && error.reason === 'too-large'
					? 'motionTooLarge'
					: 'editorDecodeFailed';
		});
		function onKey(event: KeyboardEvent) {
			if (event.defaultPrevented || event.altKey) return;
			const target = event.target as HTMLElement | null;
			if (!event.metaKey && !event.ctrlKey) {
				if (target?.closest('input, textarea, select, button, [role=tab]')) return;
				const next = keyTransform(event.key, event.shiftKey, history.doc.transform);
				if (!next || !source) return;
				event.preventDefault();
				history.apply({ ...history.doc, transform: next });
				return;
			}
			const key = event.key.toLowerCase();
			if (key === 'z' && !event.shiftKey) history.undo();
			else if ((key === 'z' && event.shiftKey) || key === 'y') history.redo();
			else return;
			event.preventDefault();
		}
		window.addEventListener('keydown', onKey);
		return () => {
			cancelled = true;
			window.removeEventListener('keydown', onKey);
			player?.dispose();
			motion?.dispose();
		};
	});
</script>

<section aria-labelledby="editor-title" class="relative flex flex-col gap-4 pb-28 md:pb-0">
	<div bind:this={videoHost} class="pointer-events-none absolute size-px overflow-hidden opacity-0"></div>
	<div class="flex items-center gap-3">
		<button
			type="button"
			onclick={onexit}
			aria-label={t('editorBack')}
			title={t('editorBack')}
			class="flex size-11 shrink-0 items-center justify-center rounded-full bg-card shadow-soft transition-colors duration-(--duration-fast) hover:bg-muted"
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-5"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M15 5l-7 7 7 7" />
			</svg>
		</button>
		<h1 id="editor-title" class="text-xl font-bold tracking-tight sm:text-2xl">{t('editorTitle')}</h1>
	</div>

	{#if loadError}
		<div role="alert" class="flex flex-col items-start gap-4 rounded-xl bg-destructive-soft p-5">
			<p class="text-sm">{t(loadError)}</p>
			<button
				type="button"
				onclick={onexit}
				class="min-h-11 rounded-full bg-foreground px-5 font-semibold text-background"
			>
				{t('editorBack')}
			</button>
		</div>
	{:else if !source}
		<SkeletonCard label={media.kind === 'image' ? t('editorLoading') : t('motionLoading')} />
	{:else}
		<div class="grid gap-4 md:grid-cols-12 md:items-start md:gap-6">
			<div class="flex flex-col gap-3 md:col-span-6 lg:col-span-7">
				<div bind:this={stage} class="editor-stage mx-auto flex w-full flex-col gap-3">
					<EditorCanvas
						{source}
						{history}
						{tool}
						{compare}
						{mask}
						{selectedText}
						brush={{ color: brushColor, width: brushWidth / STICKER_SIZE }}
						onlasso={completeLasso}
						onpick={addCutoutPoint}
						onstroke={addStroke}
						onselecttext={(id) => {
							selectedText = id;
							if (id) tab = 'text';
						}}
					/>
					<EditorToolbar {history} {compare} oncompare={(value) => (compare = value)} />
				</div>
				{#if motion && range}
					<MotionControls
						durationMs={motion.durationMs}
						{ranges}
						selectedId={range.id}
						{playing}
						{currentMs}
						onchange={changeRanges}
						onplay={play}
						onpause={pause}
						onscrub={scrub}
					/>
				{/if}
			</div>

			<div class="flex flex-col gap-4 md:sticky md:top-20 md:col-span-6 lg:col-span-5">
				<div class="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-soft">
					{#if motion && range}
						{#key range.id}
							<MotionOutput
								{history}
								{motion}
								{range}
								paused={drawing}
								render={renderMotion}
								onbuilt={(blob, durationMs) => void finish(blob, 'animated', durationMs)}
								ondownload={(blob) => save(blob, fileName(ranges.length > 1 ? `-${rangeIndex + 1}` : ''))}
								onquality={(value) => (suggested = value)}
							/>
						{/key}
					{:else}
						<StillOutput
							{history}
							{source}
							paused={drawing}
							render={renderStill}
							ondownload={(blob) => {
								void finish(blob, 'static', null);
								save(blob, fileName(''));
							}}
							onquality={(value) => (suggested = value)}
						/>
					{/if}
					{#if saved}
						<p role="status" class="flex flex-wrap items-center gap-x-2 text-sm text-success">
							{t('editorSaved')}
							<a
								href={resolve('/pack')}
								class="flex min-h-11 items-center font-semibold underline underline-offset-4"
							>
								{t('editorOpenPacks')}
							</a>
						</p>
					{/if}
				</div>

				<div class="rounded-xl bg-card shadow-soft">
					<div
						role="tablist"
						aria-label={t('editorPanels')}
						class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 gap-0.5 rounded-t-xl bg-card px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-float md:static md:grid-cols-3 md:gap-1.5 md:rounded-none md:bg-transparent md:p-3 md:shadow-none"
					>
						{#each tabs as item, index (item.id)}
							<button
								type="button"
								role="tab"
								id="tab-{item.id}"
								aria-selected={tab === item.id}
								aria-controls="panel-{item.id}"
								tabindex={tab === item.id ? 0 : -1}
								onclick={() => (tab = item.id)}
								onkeydown={(event) => onTabKey(event, index)}
								class="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-xs font-semibold whitespace-nowrap transition-colors duration-(--duration-fast) md:min-h-11 md:flex-row md:justify-start md:gap-2 md:rounded-full md:px-3 md:text-sm
									{tab === item.id
									? 'bg-secondary text-secondary-foreground md:bg-brand md:text-primary-foreground'
									: 'text-muted-foreground hover:text-foreground md:bg-muted'}"
							>
								<svg
									aria-hidden="true"
									viewBox="0 0 24 24"
									class="size-5.5 shrink-0 md:size-4.5"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d={item.icon} />
								</svg>
								{t(item.label)}
							</button>
						{/each}
					</div>
					<div
						role="tabpanel"
						id="panel-{tab}"
						aria-labelledby="tab-{tab}"
						class="p-4 md:border-t md:border-border"
					>
						{#if tab === 'shape'}
							<ShapePanel
								{history}
								{drawing}
								{lassoError}
								ondraw={startDrawing}
								oncanceldraw={cancelDrawing}
							/>
						{:else if tab === 'adjust'}
							<AdjustPanel {history} width={source.width} height={source.height} />
						{:else if tab === 'cutout'}
							<CutoutPanel
								{history}
								animated={media.kind !== 'image'}
								{picking}
								status={cutoutStatus}
								ontogglepick={() => (picking = !picking)}
							/>
						{:else if tab === 'text'}
							<TextPanel {history} selectedId={selectedText} onselect={(id) => (selectedText = id)} />
						{:else if tab === 'draw'}
							<DrawPanel
								{history}
								active={brushOn}
								color={brushColor}
								width={brushWidth}
								ontoggle={() => (brushOn = !brushOn)}
								onchange={(patch) => {
									if (patch.color) brushColor = patch.color;
									if (patch.width) brushWidth = patch.width;
								}}
							/>
						{:else}
							<QualityPanel {history} {suggested} />
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</section>
