import type { BrushStroke, FontId, Point, TextItem } from './doc.ts';
import type { Frame } from './shapes.ts';

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type CanvasLike = HTMLCanvasElement | OffscreenCanvas;

export const FONT_STACKS: Record<FontId, { weight: number; family: string }> = {
	sans: { weight: 700, family: '"Instrument Sans", system-ui, sans-serif' },
	display: { weight: 400, family: '"Anton", Impact, "Arial Black", sans-serif' },
	hand: { weight: 700, family: '"Caveat", "Segoe Print", cursive' },
	mono: { weight: 600, family: '"JetBrains Mono", ui-monospace, monospace' }
};

const LINE_HEIGHT = 1.12;
const STROKE_RATIO = 0.16;
const STROKE_COLORS = { light: '#ffffff', dark: '#111111' } as const;

export function fontString(font: FontId, px: number): string {
	const stack = FONT_STACKS[font];
	return `${stack.weight} ${Math.max(1, Math.round(px * 100) / 100)}px ${stack.family}`;
}

export async function ensureFonts(texts: TextItem[]): Promise<void> {
	if (typeof document === 'undefined' || !document.fonts) return;
	const fonts = new Set(texts.map((item) => item.font));
	await Promise.all(
		[...fonts].map((font) => document.fonts.load(fontString(font, 64), 'Aa').catch(() => []))
	);
}

export function frameToPixels(frame: Frame, point: Point): Point {
	return { x: frame.left + (point.x + 0.5) * frame.size, y: frame.top + (point.y + 0.5) * frame.size };
}

export function drawOutline(
	ctx: Context2D,
	content: CanvasLike,
	silhouette: CanvasLike,
	width: number,
	color: string
) {
	if (width <= 0) return;
	const sctx = silhouette.getContext('2d') as Context2D;
	sctx.setTransform(1, 0, 0, 1, 0, 0);
	sctx.globalCompositeOperation = 'source-over';
	sctx.clearRect(0, 0, silhouette.width, silhouette.height);
	sctx.drawImage(content, 0, 0);
	sctx.globalCompositeOperation = 'source-in';
	sctx.fillStyle = color;
	sctx.fillRect(0, 0, silhouette.width, silhouette.height);
	sctx.globalCompositeOperation = 'source-over';
	const radii = width >= 3 ? [width, width * 0.5] : [width];
	for (const radius of radii) {
		const steps = Math.min(72, Math.max(16, Math.ceil(radius * 4)));
		for (let i = 0; i < steps; i++) {
			const angle = (i / steps) * Math.PI * 2;
			ctx.drawImage(silhouette, Math.cos(angle) * radius, Math.sin(angle) * radius);
		}
	}
}

export function drawStrokes(ctx: Context2D, strokes: BrushStroke[], frame: Frame) {
	ctx.save();
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	for (const stroke of strokes) {
		const points = stroke.points.map((p) => frameToPixels(frame, p));
		const first = points[0];
		if (!first) continue;
		ctx.strokeStyle = stroke.color;
		ctx.fillStyle = stroke.color;
		ctx.lineWidth = Math.max(0.5, stroke.width * frame.size);
		ctx.beginPath();
		if (points.length === 1) {
			ctx.arc(first.x, first.y, ctx.lineWidth / 2, 0, Math.PI * 2);
			ctx.fill();
			continue;
		}
		ctx.moveTo(first.x, first.y);
		for (let i = 1; i < points.length - 1; i++) {
			const a = points[i] as Point;
			const b = points[i + 1] as Point;
			ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
		}
		const last = points[points.length - 1] as Point;
		ctx.lineTo(last.x, last.y);
		ctx.stroke();
	}
	ctx.restore();
}

export type TextBox = { cx: number; cy: number; width: number; height: number; rotation: number };

function lines(item: TextItem): string[] {
	return item.text.split('\n');
}

export function measureText(ctx: Context2D, item: TextItem, frame: Frame): TextBox {
	const px = item.size * frame.size;
	ctx.save();
	ctx.font = fontString(item.font, px);
	const width = Math.max(...lines(item).map((line) => ctx.measureText(line).width), px * 0.5);
	ctx.restore();
	const center = frameToPixels(frame, { x: item.x, y: item.y });
	const pad = item.stroke === 'none' ? px * 0.08 : px * STROKE_RATIO;
	return {
		cx: center.x,
		cy: center.y,
		width: width + pad * 2,
		height: lines(item).length * px * LINE_HEIGHT + pad * 2,
		rotation: item.rotation
	};
}

export function drawTexts(ctx: Context2D, texts: TextItem[], frame: Frame) {
	for (const item of texts) {
		const px = item.size * frame.size;
		const center = frameToPixels(frame, { x: item.x, y: item.y });
		const rows = lines(item);
		ctx.save();
		ctx.translate(center.x, center.y);
		ctx.rotate(item.rotation);
		ctx.font = fontString(item.font, px);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.lineJoin = 'round';
		ctx.miterLimit = 2;
		const top = (-(rows.length - 1) * px * LINE_HEIGHT) / 2;
		rows.forEach((row, index) => {
			const y = top + index * px * LINE_HEIGHT;
			if (item.stroke !== 'none') {
				ctx.strokeStyle = STROKE_COLORS[item.stroke];
				ctx.lineWidth = px * STROKE_RATIO * 2;
				ctx.strokeText(row, 0, y);
			}
			ctx.fillStyle = item.color;
			ctx.fillText(row, 0, y);
		});
		ctx.restore();
	}
}

export function hitBox(box: TextBox, point: Point): boolean {
	const dx = point.x - box.cx;
	const dy = point.y - box.cy;
	const cos = Math.cos(-box.rotation);
	const sin = Math.sin(-box.rotation);
	const x = dx * cos - dy * sin;
	const y = dx * sin + dy * cos;
	return Math.abs(x) <= box.width / 2 && Math.abs(y) <= box.height / 2;
}
