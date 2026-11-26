import { STICKER_SIZE } from '#lib/core/whatsapp.ts';
import { blurAlpha } from './alpha.ts';
import { STICKER_MARGIN, type EditorDoc, type Point, type Transform } from './doc.ts';
import { drawOutline, drawStrokes, drawTexts } from './layers.ts';
import { shapeOps, tracePath, type Frame } from './shapes.ts';

export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export const SOURCE_MAX_SIDE = 4096;
const LASSO_FEATHER = 1.5;

export function createCanvas(width: number, height: number): AnyCanvas {
	if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

export function context2d(canvas: AnyCanvas): Context2D {
	const ctx = canvas.getContext('2d', { willReadFrequently: false }) as Context2D | null;
	if (!ctx) throw new Error('canvas-2d-unavailable');
	return ctx;
}

export class SourceImage {
	private readonly levels: AnyCanvas[] = [];

	constructor(
		private readonly base: CanvasImageSource,
		readonly width: number,
		readonly height: number
	) {}

	get long(): number {
		return Math.max(this.width, this.height);
	}

	toCanvas(maxSide: number): HTMLCanvasElement {
		const ratio = Math.min(1, maxSide / this.long);
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(this.width * ratio));
		canvas.height = Math.max(1, Math.round(this.height * ratio));
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('canvas-2d-unavailable');
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(this.base, 0, 0, canvas.width, canvas.height);
		return canvas;
	}

	pick(factor: number): { image: CanvasImageSource; scale: number } {
		let image: CanvasImageSource = this.base;
		let scale = 1;
		let level = 0;
		while (factor <= scale / 2 && Math.min(this.width, this.height) * scale >= 8) {
			image = this.level(level);
			scale /= 2;
			level++;
		}
		return { image, scale };
	}

	private level(index: number): AnyCanvas {
		const existing = this.levels[index];
		if (existing) return existing;
		const previous: CanvasImageSource = index === 0 ? this.base : this.level(index - 1);
		const scale = 1 / 2 ** (index + 1);
		const canvas = createCanvas(
			Math.max(1, Math.round(this.width * scale)),
			Math.max(1, Math.round(this.height * scale))
		);
		const ctx = context2d(canvas);
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(previous, 0, 0, canvas.width, canvas.height);
		this.levels[index] = canvas;
		return canvas;
	}
}

export async function decodeSource(blob: Blob): Promise<SourceImage> {
	const bitmap = await createImageBitmap(blob);
	const long = Math.max(bitmap.width, bitmap.height);
	if (long <= SOURCE_MAX_SIDE) return new SourceImage(bitmap, bitmap.width, bitmap.height);
	const ratio = SOURCE_MAX_SIDE / long;
	const canvas = createCanvas(Math.round(bitmap.width * ratio), Math.round(bitmap.height * ratio));
	const ctx = context2d(canvas);
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	return new SourceImage(canvas, canvas.width, canvas.height);
}

export function stickerFrame(area: Frame, margin: boolean): Frame {
	const inset = margin ? (STICKER_MARGIN * area.size) / STICKER_SIZE : 0;
	return { left: area.left + inset, top: area.top + inset, size: area.size - inset * 2 };
}

export function frameToPixel(frame: Frame, point: Point): Point {
	return { x: frame.left + (point.x + 0.5) * frame.size, y: frame.top + (point.y + 0.5) * frame.size };
}

export function pixelToFrame(frame: Frame, point: Point): Point {
	return { x: (point.x - frame.left) / frame.size - 0.5, y: (point.y - frame.top) / frame.size - 0.5 };
}

export function drawTransformed(
	ctx: Context2D,
	source: SourceImage,
	frame: Frame,
	transform: Transform
): void {
	const factor = (transform.scale * frame.size) / source.long;
	const { image, scale } = source.pick(factor);
	const center = frameToPixel(frame, { x: transform.x, y: transform.y });
	ctx.save();
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.translate(center.x, center.y);
	ctx.rotate(transform.rotation);
	ctx.scale(factor / scale, factor / scale);
	const width = source.width * scale;
	const height = source.height * scale;
	ctx.drawImage(image, -width / 2, -height / 2, width, height);
	ctx.restore();
}

export type DrawExtras = { mask?: SourceImage | null };

const pool = new Map<string, AnyCanvas>();

function pooled(role: string, size: number): AnyCanvas {
	const key = `${role}:${size}`;
	let canvas = pool.get(key);
	if (!canvas) {
		canvas = createCanvas(size, size);
		pool.set(key, canvas);
	}
	return canvas;
}

function drawContent(
	content: AnyCanvas,
	source: SourceImage,
	doc: EditorDoc,
	size: number,
	extras: DrawExtras
) {
	const ctx = context2d(content);
	const frame = stickerFrame({ left: 0, top: 0, size }, doc.margin);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.globalCompositeOperation = 'source-over';
	ctx.clearRect(0, 0, content.width, content.height);
	drawTransformed(ctx, source, frame, doc.transform);
	ctx.globalCompositeOperation = 'destination-in';
	if (extras.mask) drawTransformed(ctx, extras.mask, frame, doc.transform);
	const ops = shapeOps(doc.shape, frame, doc.transform);
	if (doc.shape.kind === 'lasso') {
		const mask = pooled('lasso', content.width);
		const maskCtx = context2d(mask);
		maskCtx.setTransform(1, 0, 0, 1, 0, 0);
		maskCtx.clearRect(0, 0, mask.width, mask.height);
		maskCtx.beginPath();
		tracePath(maskCtx, ops);
		maskCtx.fillStyle = '#000';
		maskCtx.fill();
		const pixels = maskCtx.getImageData(0, 0, mask.width, mask.height);
		blurAlpha(pixels.data, mask.width, mask.height, Math.max(1, (LASSO_FEATHER * size) / STICKER_SIZE));
		maskCtx.putImageData(pixels, 0, 0);
		ctx.drawImage(mask, 0, 0);
	} else {
		ctx.beginPath();
		tracePath(ctx, ops);
		ctx.fillStyle = '#000';
		ctx.fill();
	}
	ctx.globalCompositeOperation = 'source-over';
}

export function drawSticker(
	target: AnyCanvas,
	source: SourceImage,
	doc: EditorDoc,
	area: Frame,
	extras: DrawExtras = {}
): void {
	const ctx = context2d(target);
	const size = Math.ceil(area.size);
	const content = pooled('content', size);
	drawContent(content, source, doc, area.size, extras);
	const frame = stickerFrame({ left: 0, top: 0, size: area.size }, doc.margin);
	ctx.save();
	ctx.clearRect(area.left, area.top, area.size, area.size);
	ctx.beginPath();
	ctx.rect(area.left, area.top, area.size, area.size);
	ctx.clip();
	ctx.translate(area.left, area.top);
	drawOutline(
		ctx,
		content,
		pooled('silhouette', size),
		(doc.outline.width * area.size) / STICKER_SIZE,
		doc.outline.color
	);
	ctx.drawImage(content, 0, 0);
	drawStrokes(ctx, doc.strokes, frame);
	drawTexts(ctx, doc.texts, frame);
	ctx.restore();
}

export function renderStickerPixels(source: SourceImage, doc: EditorDoc, extras: DrawExtras = {}): ImageData {
	const canvas = createCanvas(STICKER_SIZE, STICKER_SIZE);
	drawSticker(canvas, source, doc, { left: 0, top: 0, size: STICKER_SIZE }, extras);
	return context2d(canvas).getImageData(0, 0, STICKER_SIZE, STICKER_SIZE);
}
