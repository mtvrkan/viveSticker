import { STICKER_SIZE } from '#lib/core/whatsapp.ts';
import {
	candidateLadder,
	ESTIMATE_HEADROOM,
	frameSchedule,
	muxAnimatedWebp,
	outputDuration,
	predictBytes,
	readStillWebp,
	sampleIndexes,
	type Candidate,
	type ClipRange,
	type MotionFrame,
	type MotionSource
} from '#lib/features/animate/index.ts';
import type { QualityMode } from './doc.ts';
import type { FrameEncoderPool } from './encoder.ts';

export type FrameRenderer = (frame: MotionFrame) => Promise<ImageData>;

export type MotionJob = {
	motion: MotionSource;
	range: ClipRange;
	render: FrameRenderer;
	pool: FrameEncoderPool;
	quality: QualityMode;
	limit: number;
	signal?: AbortSignal;
	onprogress?: (fraction: number) => void;
};

export type MotionEstimate = {
	candidate: Candidate;
	bytes: number;
	frames: number;
	durationMs: number;
	fits: boolean;
};

export type MotionResult = MotionEstimate & { blob: Blob };

const SAMPLE_COUNT = 6;
const MAX_PASSES = 4;

export class BuildAborted extends Error {}

function check(signal?: AbortSignal) {
	if (signal?.aborted) throw new BuildAborted();
}

function copy(pixels: ImageData): ImageData {
	return new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height);
}

class Sampler {
	private samples: ImageData[] | null = null;
	private readonly averages = new Map<number, number>();

	constructor(private readonly job: MotionJob) {}

	async average(quality: number): Promise<number> {
		const cached = this.averages.get(quality);
		if (cached !== undefined) return cached;
		const samples = await this.load();
		const sizes = await Promise.all(
			samples.map(
				async (pixels) => readStillWebp(await this.job.pool.encodeFrame(copy(pixels), quality)).payload.length
			)
		);
		check(this.job.signal);
		const average = sizes.reduce((sum, size) => sum + size, 0) / Math.max(1, sizes.length);
		this.averages.set(quality, average);
		return average;
	}

	private async load(): Promise<ImageData[]> {
		if (this.samples) return this.samples;
		const ladder = candidateLadder(this.job.motion.fps);
		const schedule = frameSchedule(this.job.range, (ladder[0] as Candidate).fps);
		const samples: ImageData[] = [];
		for (const index of sampleIndexes(schedule.sourceMs.length, SAMPLE_COUNT)) {
			check(this.job.signal);
			samples.push(await this.job.render(await this.job.motion.frameAt(schedule.sourceMs[index] as number)));
		}
		this.samples = samples;
		return samples;
	}
}

function ladderFor(job: MotionJob): Candidate[] {
	const ladder = candidateLadder(job.motion.fps);
	if (job.quality.mode === 'manual')
		return [{ quality: job.quality.quality, fps: (ladder[0] as Candidate).fps }];
	return ladder;
}

async function predict(sampler: Sampler, job: MotionJob, candidate: Candidate, correction: number) {
	const frames = frameSchedule(job.range, candidate.fps).sourceMs.length;
	return predictBytes((await sampler.average(candidate.quality)) * correction, frames);
}

async function choose(
	sampler: Sampler,
	job: MotionJob,
	ladder: Candidate[],
	from: number,
	correction: number
) {
	for (let index = from; index < ladder.length; index++) {
		const bytes = await predict(sampler, job, ladder[index] as Candidate, correction);
		if (bytes <= job.limit * ESTIMATE_HEADROOM) return { index, bytes };
	}
	const last = ladder.length - 1;
	return { index: last, bytes: await predict(sampler, job, ladder[last] as Candidate, correction) };
}

export async function estimateMotion(job: MotionJob): Promise<MotionEstimate> {
	const ladder = ladderFor(job);
	const sampler = new Sampler(job);
	const { index, bytes } = await choose(sampler, job, ladder, 0, 1);
	const candidate = ladder[index] as Candidate;
	return {
		candidate,
		bytes,
		frames: frameSchedule(job.range, candidate.fps).sourceMs.length,
		durationMs: Math.round(outputDuration(job.range)),
		fits: bytes <= job.limit
	};
}

async function encodeAll(job: MotionJob, candidate: Candidate, pass: number): Promise<Uint8Array> {
	const schedule = frameSchedule(job.range, candidate.fps);
	const count = schedule.sourceMs.length;
	const results: Uint8Array[] = new Array(count);
	const inflight = new Set<Promise<void>>();
	let done = 0;
	const report = () => job.onprogress?.(Math.min(0.99, (pass + done / count) / (pass + 1)));
	for (let i = 0; i < count; i++) {
		check(job.signal);
		const pixels = await job.render(await job.motion.frameAt(schedule.sourceMs[i] as number));
		const task = job.pool.encodeFrame(pixels, candidate.quality).then((webp) => {
			results[i] = webp;
			done++;
			report();
		});
		inflight.add(task);
		void task.finally(() => inflight.delete(task)).catch(() => undefined);
		if (inflight.size >= job.pool.size * 2) await Promise.race(inflight);
	}
	await Promise.all(inflight);
	check(job.signal);
	return muxAnimatedWebp(
		results.map((webp, i) => ({ webp, durationMs: schedule.durations[i] as number, blend: false })),
		{ width: STICKER_SIZE, height: STICKER_SIZE }
	);
}

export async function buildMotion(job: MotionJob): Promise<MotionResult> {
	const ladder = ladderFor(job);
	const sampler = new Sampler(job);
	let correction = 1;
	let { index, bytes: predicted } = await choose(sampler, job, ladder, 0, correction);
	let output: { bytes: Uint8Array; candidate: Candidate } | null = null;
	for (let pass = 0; pass < MAX_PASSES; pass++) {
		const candidate = ladder[index] as Candidate;
		const bytes = await encodeAll(job, candidate, pass);
		output = { bytes, candidate };
		if (bytes.length <= job.limit || job.quality.mode === 'manual' || index >= ladder.length - 1) break;
		correction *= bytes.length / Math.max(1, predicted);
		({ index, bytes: predicted } = await choose(sampler, job, ladder, index + 1, correction));
	}
	if (!output) throw new BuildAborted();
	job.onprogress?.(1);
	return {
		blob: new Blob([output.bytes.slice().buffer], { type: 'image/webp' }),
		bytes: output.bytes.length,
		candidate: output.candidate,
		frames: frameSchedule(job.range, output.candidate.fps).sourceMs.length,
		durationMs: Math.round(outputDuration(job.range)),
		fits: output.bytes.length <= job.limit
	};
}
