export type Point = { x: number; y: number };

export type Transform = {
	x: number;
	y: number;
	scale: number;
	rotation: number;
};

export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

export type PresetShape = 'heart' | 'star' | 'bubble';

export type Shape =
	| { kind: 'rect'; aspect: AspectRatio; corner: number }
	| { kind: 'circle' }
	| { kind: 'preset'; preset: PresetShape }
	| { kind: 'lasso'; points: Point[] };

export type ShapeKind = Shape['kind'];

export type QualityMode = { mode: 'auto' } | { mode: 'manual'; quality: number };

export type Cutout = { mode: 'none' } | { mode: 'object'; points: Point[] } | { mode: 'person' };

export type Outline = { width: number; color: string };

export type FontId = 'sans' | 'display' | 'hand' | 'mono';

export type TextStroke = 'none' | 'light' | 'dark';

export type TextItem = {
	id: string;
	text: string;
	x: number;
	y: number;
	size: number;
	rotation: number;
	color: string;
	font: FontId;
	stroke: TextStroke;
};

export type BrushStroke = { color: string; width: number; points: Point[] };

export type EditorDoc = {
	transform: Transform;
	shape: Shape;
	margin: boolean;
	quality: QualityMode;
	cutout: Cutout;
	outline: Outline;
	texts: TextItem[];
	strokes: BrushStroke[];
};

export const ASPECT_RATIOS: readonly AspectRatio[] = ['1:1', '4:3', '3:4', '16:9', '9:16'];
export const PRESET_SHAPES: readonly PresetShape[] = ['heart', 'star', 'bubble'];
export const STICKER_MARGIN = 16;
export const OUTLINE_MAX = 16;
export const FONT_IDS: readonly FontId[] = ['sans', 'display', 'hand', 'mono'];
export const INK_COLORS = [
	{ id: 'white', value: '#ffffff' },
	{ id: 'black', value: '#111111' },
	{ id: 'red', value: '#ff3b30' },
	{ id: 'orange', value: '#ff9500' },
	{ id: 'yellow', value: '#ffcc00' },
	{ id: 'green', value: '#34c759' },
	{ id: 'blue', value: '#007aff' },
	{ id: 'purple', value: '#af52de' }
] as const;
export type InkColor = (typeof INK_COLORS)[number];
export const OBJECT_POINTS_MAX = 8;
export const BRUSH_MIN = 2;
export const BRUSH_MAX = 40;
export const TEXT_SIZE_MIN = 0.04;
export const TEXT_SIZE_MAX = 0.4;
export const MIN_SCALE = 0.1;
export const MAX_SCALE = 20;
export const MANUAL_QUALITY_MIN = 10;
export const MANUAL_QUALITY_MAX = 100;

export function aspectValue(aspect: AspectRatio): number {
	const [w, h] = aspect.split(':').map(Number) as [number, number];
	return w / h;
}

export function containTransform(): Transform {
	return { x: 0, y: 0, scale: 1, rotation: 0 };
}

export function coverTransform(width: number, height: number, rotation = 0): Transform {
	const long = Math.max(width, height);
	const short = Math.min(width, height);
	return { x: 0, y: 0, scale: short > 0 ? long / short : 1, rotation };
}

export function createDoc(): EditorDoc {
	return {
		transform: containTransform(),
		shape: { kind: 'rect', aspect: '1:1', corner: 0 },
		margin: true,
		quality: { mode: 'auto' },
		cutout: { mode: 'none' },
		outline: { width: 0, color: '#ffffff' },
		texts: [],
		strokes: []
	};
}

export function cloneDoc(doc: EditorDoc): EditorDoc {
	return JSON.parse(JSON.stringify(doc)) as EditorDoc;
}

export function sameDoc(a: EditorDoc, b: EditorDoc): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function clampScale(scale: number): number {
	return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

let itemCounter = 0;

export function itemId(): string {
	itemCounter += 1;
	return `item-${Date.now().toString(36)}-${itemCounter}`;
}
