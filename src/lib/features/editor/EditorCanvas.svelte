<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '#lib/i18n/index.svelte.ts';
	import { pan, pinch, rotateAround, snap, toImage, zoomAt, type SnapResult } from './geometry.ts';
	import type { BrushStroke, Point, Transform } from './doc.ts';
	import { hitBox, measureText } from './layers.ts';
	import type { EditorHistory } from './history.svelte.ts';
	import { PointerSet } from './pointers.ts';
	import { TOOL_HINTS, type CanvasTool } from './tools.ts';
	import {
		createCanvas,
		drawSticker,
		drawTransformed,
		pixelToFrame,
		stickerFrame,
		type AnyCanvas,
		type SourceImage
	} from './render.ts';
	import { shapeOps, tracePath, type Frame } from './shapes.ts';

	let {
		source,
		history,
		tool,
		compare,
		mask,
		brush,
		selectedText,
		onlasso,
		onpick,
		onstroke,
		onselecttext
	}: {
		source: SourceImage;
		history: EditorHistory;
		tool: CanvasTool;
		compare: boolean;
		mask: SourceImage | null;
		brush: Omit<BrushStroke, 'points'>;
		selectedText: string | null;
		onlasso: (points: Point[], pixelTolerance: number) => void;
		onpick: (point: Point) => void;
		onstroke: (points: Point[]) => void;
		onselecttext: (id: string | null) => void;
	} = $props();

	const drawing = $derived(tool === 'lasso');

	const PADDING = 0.07;
	const CONTEXT_ALPHA = 0.28;
	const WHEEL_COMMIT_MS = 300;
	const TAP_SLOP = 12;

	let canvas: HTMLCanvasElement;
	let wrapper: HTMLDivElement;
	let size = $state(0);
	let ratio = 1;
	let frameId = 0;
	let snapState: Pick<SnapResult, 'snapX' | 'snapY'> = { snapX: false, snapY: false };
	let lassoPoints: Point[] = [];
	let brushPoints: Point[] = [];
	let tapStart: Point | null = null;
	let textDrag: { id: string; start: Point; origin: Point } | null = null;
	let wheelTimer: ReturnType<typeof setTimeout> | undefined;
	let composite: AnyCanvas | null = null;
	let colors = {
		primary: 'currentcolor',
		border: 'currentcolor',
		checkerA: 'transparent',
		checkerB: 'transparent'
	};

	const pointers = new PointerSet();
	let gesture: { transform: Transform; points: Point[] } | null = null;

	function area(): Frame {
		const backing = size * ratio;
		const pad = Math.round(backing * PADDING);
		return { left: pad, top: pad, size: backing - pad * 2 };
	}

	function frame(): Frame {
		return stickerFrame(area(), history.doc.margin);
	}

	function local(event: PointerEvent | WheelEvent): Point {
		const rect = canvas.getBoundingClientRect();
		return { x: (event.clientX - rect.left) * ratio, y: (event.clientY - rect.top) * ratio };
	}

	function requestDraw() {
		if (frameId) return;
		frameId = requestAnimationFrame(() => {
			frameId = 0;
			draw();
		});
	}

	function checker(ctx: CanvasRenderingContext2D, box: Frame) {
		const cell = Math.max(4, Math.round(8 * ratio));
		ctx.fillStyle = colors.checkerA;
		ctx.fillRect(box.left, box.top, box.size, box.size);
		ctx.fillStyle = colors.checkerB;
		const count = Math.ceil(box.size / cell);
		for (let row = 0; row < count; row++) {
			for (let column = row % 2; column < count; column += 2) {
				const x = box.left + column * cell;
				const y = box.top + row * cell;
				ctx.fillRect(x, y, Math.min(cell, box.left + box.size - x), Math.min(cell, box.top + box.size - y));
			}
		}
	}

	function draw() {
		const ctx = canvas?.getContext('2d');
		if (!ctx || size === 0) return;
		const doc = history.doc;
		const box = area();
		const inner = stickerFrame(box, doc.margin);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (compare) {
			checker(ctx, box);
			drawTransformed(ctx, source, box, { x: 0, y: 0, scale: 1, rotation: 0 });
			strokeBox(ctx, box);
			return;
		}

		ctx.save();
		ctx.globalAlpha = CONTEXT_ALPHA;
		drawTransformed(ctx, source, inner, doc.transform);
		ctx.restore();

		const compositeSize = Math.ceil(box.size);
		if (!composite || composite.width !== compositeSize)
			composite = createCanvas(compositeSize, compositeSize);
		drawSticker(composite, source, doc, { left: 0, top: 0, size: box.size }, { mask });
		checker(ctx, box);
		ctx.drawImage(composite, box.left, box.top);
		strokeBox(ctx, box);

		const selected = selectedText ? doc.texts.find((item) => item.id === selectedText) : undefined;
		if (selected && tool === 'move') {
			const boxed = measureText(ctx, selected, inner);
			ctx.save();
			ctx.translate(boxed.cx, boxed.cy);
			ctx.rotate(boxed.rotation);
			ctx.strokeStyle = colors.primary;
			ctx.lineWidth = 1.5 * ratio;
			ctx.setLineDash([5 * ratio, 4 * ratio]);
			ctx.strokeRect(-boxed.width / 2, -boxed.height / 2, boxed.width, boxed.height);
			ctx.restore();
		}

		if (brushPoints.length > 0) {
			ctx.save();
			ctx.strokeStyle = brush.color;
			ctx.lineWidth = Math.max(1, brush.width * inner.size);
			ctx.lineJoin = 'round';
			ctx.lineCap = 'round';
			ctx.beginPath();
			brushPoints.forEach((p, index) => (index === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
			if (brushPoints.length === 1) ctx.lineTo(brushPoints[0]!.x + 0.01, brushPoints[0]!.y);
			ctx.stroke();
			ctx.restore();
		}

		if (!drawing && tool !== 'brush') {
			ctx.save();
			ctx.beginPath();
			tracePath(ctx, shapeOps(doc.shape, inner, doc.transform));
			ctx.strokeStyle = colors.primary;
			ctx.lineWidth = 1.5 * ratio;
			ctx.stroke();
			ctx.restore();
		}

		if (snapState.snapX || snapState.snapY) {
			ctx.save();
			ctx.strokeStyle = colors.primary;
			ctx.lineWidth = ratio;
			ctx.setLineDash([6 * ratio, 4 * ratio]);
			const cx = inner.left + inner.size / 2;
			const cy = inner.top + inner.size / 2;
			ctx.beginPath();
			if (snapState.snapX) {
				ctx.moveTo(cx, box.top);
				ctx.lineTo(cx, box.top + box.size);
			}
			if (snapState.snapY) {
				ctx.moveTo(box.left, cy);
				ctx.lineTo(box.left + box.size, cy);
			}
			ctx.stroke();
			ctx.restore();
		}

		if (drawing && lassoPoints.length > 1) {
			ctx.save();
			ctx.strokeStyle = colors.primary;
			ctx.lineWidth = 2 * ratio;
			ctx.lineJoin = 'round';
			ctx.lineCap = 'round';
			ctx.beginPath();
			lassoPoints.forEach((p, index) => (index === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
			ctx.stroke();
			ctx.restore();
		}
	}

	function strokeBox(ctx: CanvasRenderingContext2D, box: Frame) {
		ctx.save();
		ctx.strokeStyle = colors.border;
		ctx.lineWidth = ratio;
		ctx.strokeRect(box.left + 0.5, box.top + 0.5, box.size - 1, box.size - 1);
		ctx.restore();
	}

	function previewTransform(next: Transform, withSnap: boolean) {
		const result = withSnap ? snap(next) : { transform: next, snapX: false, snapY: false };
		snapState = { snapX: result.snapX, snapY: result.snapY };
		history.preview({ ...history.doc, transform: result.transform });
	}

	function startGesture() {
		gesture = { transform: { ...history.doc.transform }, points: pointers.list() };
	}

	function toFramePoints(points: Point[]): Point[] {
		const current = frame();
		return points.map((p) => pixelToFrame(current, p));
	}

	function textAt(point: Point): string | null {
		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		const inner = stickerFrame(area(), history.doc.margin);
		const texts = history.doc.texts;
		for (let i = texts.length - 1; i >= 0; i--) {
			const item = texts[i]!;
			if (hitBox(measureText(ctx, item, inner), point)) return item.id;
		}
		return null;
	}

	function onPointerDown(event: PointerEvent) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		canvas.setPointerCapture(event.pointerId);
		const point = local(event);
		pointers.set(event.pointerId, point);
		if (pointers.size === 1) {
			if (drawing) {
				lassoPoints = [point];
				requestDraw();
				return;
			}
			if (tool === 'brush') {
				brushPoints = [point];
				requestDraw();
				return;
			}
			if (tool === 'pick') {
				tapStart = point;
				return;
			}
			const hit = textAt(point);
			if (hit) {
				const item = history.doc.texts.find((text) => text.id === hit)!;
				textDrag = { id: hit, start: point, origin: { x: item.x, y: item.y } };
				onselecttext(hit);
				return;
			}
		}
		lassoPoints = [];
		brushPoints = [];
		tapStart = null;
		textDrag = null;
		startGesture();
	}

	function onPointerMove(event: PointerEvent) {
		if (!pointers.has(event.pointerId)) return;
		const point = local(event);
		pointers.set(event.pointerId, point);
		if (drawing && pointers.size === 1 && lassoPoints.length > 0) {
			lassoPoints.push(point);
			requestDraw();
			return;
		}
		if (tool === 'brush' && pointers.size === 1 && brushPoints.length > 0) {
			brushPoints.push(point);
			requestDraw();
			return;
		}
		if (tapStart) return;
		if (textDrag) {
			const current = frame();
			const dx = (point.x - textDrag.start.x) / current.size;
			const dy = (point.y - textDrag.start.y) / current.size;
			const id = textDrag.id;
			const origin = textDrag.origin;
			history.preview({
				...history.doc,
				texts: history.doc.texts.map((item) =>
					item.id === id ? { ...item, x: origin.x + dx, y: origin.y + dy } : item
				)
			});
			requestDraw();
			return;
		}
		if (!gesture) return;
		const now = toFramePoints(pointers.list());
		const start = toFramePoints(gesture.points);
		if (now.length >= 2 && start.length >= 2) {
			previewTransform(pinch(gesture.transform, [start[0]!, start[1]!], [now[0]!, now[1]!]), true);
		} else if (now.length === 1 && start.length >= 1) {
			previewTransform(pan(gesture.transform, now[0]!.x - start[0]!.x, now[0]!.y - start[0]!.y), true);
		}
	}

	function onPointerUp(event: PointerEvent) {
		const last = pointers.get(event.pointerId);
		if (!pointers.delete(event.pointerId)) return;
		const completed = event.type === 'pointerup';
		if (tapStart) {
			const start = tapStart;
			tapStart = null;
			if (completed && last && Math.hypot(last.x - start.x, last.y - start.y) <= TAP_SLOP * ratio)
				onpick(toImage(pixelToFrame(frame(), last), history.doc.transform));
			return;
		}
		if (brushPoints.length > 0) {
			const current = frame();
			const points = brushPoints.map((p) => pixelToFrame(current, p));
			brushPoints = [];
			if (completed) onstroke(points);
			requestDraw();
			return;
		}
		if (textDrag) {
			textDrag = null;
			history.commit();
			return;
		}
		if (drawing && lassoPoints.length > 0) {
			const current = frame();
			const transform = history.doc.transform;
			const imagePoints = lassoPoints.map((p) => toImage(pixelToFrame(current, p), transform));
			const tolerance = (1.5 * ratio) / current.size / transform.scale;
			lassoPoints = [];
			onlasso(imagePoints, tolerance);
			requestDraw();
			return;
		}
		if (pointers.size === 0) {
			gesture = null;
			snapState = { snapX: false, snapY: false };
			history.commit();
			requestDraw();
		} else {
			startGesture();
		}
	}

	function onWheel(event: WheelEvent) {
		event.preventDefault();
		const focus = pixelToFrame(frame(), local(event));
		const strength = event.ctrlKey ? 0.01 : 0.0015;
		const transform = history.doc.transform;
		if (event.shiftKey && !event.ctrlKey) {
			previewTransform(rotateAround(transform, -event.deltaY * 0.002, focus), false);
		} else {
			previewTransform(zoomAt(transform, Math.exp(-event.deltaY * strength), focus), false);
		}
		clearTimeout(wheelTimer);
		wheelTimer = setTimeout(() => history.commit(), WHEEL_COMMIT_MS);
	}

	$effect(() => {
		JSON.stringify(history.doc);
		void compare;
		void tool;
		void mask;
		void brush;
		void selectedText;
		void size;
		void source;
		requestDraw();
	});

	onMount(() => {
		const styles = getComputedStyle(document.documentElement);
		const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
		colors = {
			primary: read('--color-primary', colors.primary),
			border: read('--color-input', colors.border),
			checkerA: read('--color-checker-a', colors.checkerA),
			checkerB: read('--color-checker-b', colors.checkerB)
		};
		const observer = new ResizeObserver(() => {
			ratio = Math.min(3, window.devicePixelRatio || 1);
			const next = Math.floor(wrapper.clientWidth);
			canvas.width = Math.round(next * ratio);
			canvas.height = Math.round(next * ratio);
			size = next;
			requestDraw();
		});
		observer.observe(wrapper);
		const blockGesture = (event: Event) => event.preventDefault();
		canvas.addEventListener('wheel', onWheel, { passive: false });
		canvas.addEventListener('gesturestart', blockGesture);
		const redraw = () => requestDraw();
		document.fonts?.addEventListener('loadingdone', redraw);
		return () => {
			observer.disconnect();
			canvas.removeEventListener('wheel', onWheel);
			canvas.removeEventListener('gesturestart', blockGesture);
			document.fonts?.removeEventListener('loadingdone', redraw);
			cancelAnimationFrame(frameId);
			clearTimeout(wheelTimer);
		};
	});
</script>

<div
	bind:this={wrapper}
	role="img"
	aria-label={t('editorCanvasLabel')}
	aria-describedby="editor-canvas-hint"
	class="aspect-square w-full"
>
	<canvas
		bind:this={canvas}
		class="block size-full touch-none rounded-lg select-none {tool === 'move'
			? 'cursor-grab active:cursor-grabbing'
			: 'cursor-crosshair'}"
		style="width: {size}px; height: {size}px"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
	></canvas>
	<p id="editor-canvas-hint" class="sr-only">{t(TOOL_HINTS[tool])}</p>
</div>
