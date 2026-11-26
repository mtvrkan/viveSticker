import { asset } from '$app/paths';
import { ImageSegmenter, InteractiveSegmenterLegacy, type MPMask } from '@mediapipe/tasks-vision';
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';

export type NormalizedPoint = { x: number; y: number };

const fileset = { wasmLoaderPath, wasmBinaryPath };
const EDGE_LOW = 0.35;
const EDGE_HIGH = 0.65;
const PERSON_INPUT = 512;

let interactive: Promise<InteractiveSegmenterLegacy> | null = null;
let selfie: Promise<ImageSegmenter> | null = null;

function retryable<T>(promise: Promise<T>, reset: () => void): Promise<T> {
	promise.catch(reset);
	return promise;
}

function interactiveSegmenter(): Promise<InteractiveSegmenterLegacy> {
	interactive ??= retryable(
		InteractiveSegmenterLegacy.createFromOptions(fileset, {
			baseOptions: { modelAssetPath: asset('models/magic_touch.tflite'), delegate: 'CPU' },
			outputCategoryMask: false,
			outputConfidenceMasks: true
		}),
		() => (interactive = null)
	);
	return interactive;
}

function selfieSegmenter(): Promise<ImageSegmenter> {
	selfie ??= retryable(
		ImageSegmenter.createFromOptions(fileset, {
			baseOptions: { modelAssetPath: asset('models/selfie_segmenter.tflite'), delegate: 'CPU' },
			runningMode: 'IMAGE',
			outputCategoryMask: false,
			outputConfidenceMasks: true
		}),
		() => (selfie = null)
	);
	return selfie;
}

type Plane = { values: Float32Array; width: number; height: number };

function readMask(masks: MPMask[] | undefined): Plane | null {
	const mask = masks?.[masks.length - 1];
	if (!mask) return null;
	return { values: mask.getAsFloat32Array().slice(), width: mask.width, height: mask.height };
}

function planeToCanvas(plane: Plane): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = plane.width;
	canvas.height = plane.height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('canvas-2d-unavailable');
	const image = ctx.createImageData(plane.width, plane.height);
	const span = EDGE_HIGH - EDGE_LOW;
	for (let i = 0; i < plane.values.length; i++) {
		const t = Math.min(1, Math.max(0, ((plane.values[i] ?? 0) - EDGE_LOW) / span));
		image.data[i * 4 + 3] = Math.round(t * t * (3 - 2 * t) * 255);
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}

export async function preloadObjectModel(): Promise<void> {
	await interactiveSegmenter();
}

export async function preloadPersonModel(): Promise<void> {
	await selfieSegmenter();
}

export class ObjectCutter {
	private readonly planes = new Map<string, Plane | null>();

	constructor(private readonly image: HTMLCanvasElement) {}

	async mask(points: NormalizedPoint[]): Promise<HTMLCanvasElement | null> {
		if (points.length === 0) return null;
		const segmenter = await interactiveSegmenter();
		let combined: Plane | null = null;
		for (const point of points) {
			const plane = this.plane(segmenter, point);
			if (!plane) continue;
			if (!combined) {
				combined = { ...plane, values: plane.values.slice() };
				continue;
			}
			if (plane.width !== combined.width || plane.height !== combined.height) continue;
			for (let i = 0; i < combined.values.length; i++)
				combined.values[i] = Math.max(combined.values[i] ?? 0, plane.values[i] ?? 0);
		}
		return combined ? planeToCanvas(combined) : null;
	}

	private plane(segmenter: InteractiveSegmenterLegacy, point: NormalizedPoint): Plane | null {
		const key = `${point.x.toFixed(4)}:${point.y.toFixed(4)}`;
		if (this.planes.has(key)) return this.planes.get(key) ?? null;
		let plane: Plane | null = null;
		segmenter.segment(this.image, { keypoint: point }, (result) => {
			plane = readMask(result.confidenceMasks);
		});
		this.planes.set(key, plane);
		return plane;
	}
}

export class PersonCutter {
	private readonly input = document.createElement('canvas');

	private constructor(private readonly segmenter: ImageSegmenter) {}

	static async create(): Promise<PersonCutter> {
		return new PersonCutter(await selfieSegmenter());
	}

	mask(image: CanvasImageSource, width: number, height: number): HTMLCanvasElement | null {
		const ratio = Math.min(1, PERSON_INPUT / Math.max(width, height));
		const w = Math.max(1, Math.round(width * ratio));
		const h = Math.max(1, Math.round(height * ratio));
		if (this.input.width !== w || this.input.height !== h) {
			this.input.width = w;
			this.input.height = h;
		}
		const ctx = this.input.getContext('2d');
		if (!ctx) return null;
		ctx.clearRect(0, 0, w, h);
		ctx.drawImage(image, 0, 0, w, h);
		let plane: Plane | null = null;
		this.segmenter.segment(this.input, (result) => {
			plane = readMask(result.confidenceMasks);
		});
		return plane ? planeToCanvas(plane) : null;
	}
}
