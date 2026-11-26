import { ANIMATED_MAX_MS, ANIMATED_MIN_FRAME_MS } from '#lib/core/whatsapp.ts';

export type ClipRange = { id: string; startMs: number; endMs: number; speed: number };
export type Candidate = { quality: number; fps: number };
export type FrameSchedule = { sourceMs: number[]; durations: number[] };

export const SPEEDS: readonly number[] = [0.5, 1, 1.5, 2];
export const DEFAULT_CLIP_MS = 3000;
export const MIN_CLIP_MS = 200;
export const MAX_FPS = 20;
export const FPS_STEPS: readonly number[] = [20, 15, 12, 10, 8, 6, 5];
export const QUALITY_STEPS: readonly number[] = [82, 72, 62, 52, 42, 32, 24];
export const FRAME_OVERHEAD_BYTES = 24;
export const FILE_OVERHEAD_BYTES = 64;
export const ESTIMATE_HEADROOM = 0.94;

let counter = 0;

export function rangeId(): string {
	counter += 1;
	return `range-${Date.now().toString(36)}-${counter}`;
}

export function outputDuration(range: ClipRange): number {
	return (range.endMs - range.startMs) / range.speed;
}

export function clampRange(
	range: ClipRange,
	durationMs: number,
	anchor: 'start' | 'end' = 'start'
): ClipRange {
	const maxSpan = Math.min(durationMs, ANIMATED_MAX_MS * range.speed);
	const minSpan = Math.min(MIN_CLIP_MS, durationMs);
	let startMs = Math.max(0, Math.min(range.startMs, durationMs));
	let endMs = Math.max(0, Math.min(range.endMs, durationMs));
	if (anchor === 'start') {
		endMs = Math.min(Math.max(endMs, startMs + minSpan), startMs + maxSpan, durationMs);
		startMs = Math.min(startMs, endMs - minSpan);
	} else {
		startMs = Math.max(Math.min(startMs, endMs - minSpan), endMs - maxSpan, 0);
		endMs = Math.max(endMs, startMs + minSpan);
	}
	return { ...range, startMs: Math.max(0, startMs), endMs: Math.min(durationMs, endMs) };
}

export function defaultRange(durationMs: number, after?: ClipRange): ClipRange {
	const start = after && after.endMs < durationMs - MIN_CLIP_MS ? after.endMs : 0;
	return clampRange(
		{ id: rangeId(), startMs: start, endMs: start + Math.min(DEFAULT_CLIP_MS, ANIMATED_MAX_MS), speed: 1 },
		durationMs
	);
}

export function frameSchedule(range: ClipRange, fps: number): FrameSchedule {
	const total = Math.min(outputDuration(range), ANIMATED_MAX_MS);
	const step = Math.max(1000 / fps, ANIMATED_MIN_FRAME_MS);
	const count = Math.max(1, Math.round(total / step));
	const sourceMs: number[] = [];
	const durations: number[] = [];
	for (let i = 0; i < count; i++) {
		const startOut = (i * total) / count;
		const endOut = ((i + 1) * total) / count;
		sourceMs.push(range.startMs + startOut * range.speed);
		durations.push(Math.max(ANIMATED_MIN_FRAME_MS, Math.round(endOut) - Math.round(startOut)));
	}
	return { sourceMs, durations };
}

export function candidateLadder(maxFps: number): Candidate[] {
	const fpsList = [Math.min(MAX_FPS, Math.max(1, Math.round(maxFps))), ...FPS_STEPS].filter(
		(fps, index, list) =>
			fps <= Math.min(MAX_FPS, Math.max(1, Math.round(maxFps))) && list.indexOf(fps) === index
	);
	const ladder: Candidate[] = [];
	let q = 0;
	let f = 0;
	ladder.push({ quality: QUALITY_STEPS[q] as number, fps: fpsList[f] as number });
	while (q < QUALITY_STEPS.length - 1 || f < fpsList.length - 1) {
		if (q < QUALITY_STEPS.length - 1) {
			q++;
			ladder.push({ quality: QUALITY_STEPS[q] as number, fps: fpsList[f] as number });
		}
		if (f < fpsList.length - 1) {
			f++;
			ladder.push({ quality: QUALITY_STEPS[q] as number, fps: fpsList[f] as number });
		}
	}
	return ladder;
}

export function predictBytes(averageFrameBytes: number, frameCount: number): number {
	return Math.round(averageFrameBytes * frameCount + frameCount * FRAME_OVERHEAD_BYTES + FILE_OVERHEAD_BYTES);
}

export function sampleIndexes(count: number, samples: number): number[] {
	if (count <= samples) return Array.from({ length: count }, (_, i) => i);
	return Array.from({ length: samples }, (_, i) => Math.round(((i + 0.5) * count) / samples - 0.5));
}

export function nativeFps(delays: number[]): number {
	if (delays.length === 0) return MAX_FPS;
	const average = delays.reduce((sum, value) => sum + value, 0) / delays.length;
	return average > 0 ? Math.min(MAX_FPS, 1000 / average) : MAX_FPS;
}
