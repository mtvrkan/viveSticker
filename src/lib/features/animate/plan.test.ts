import { describe, expect, it } from 'vitest';
import {
	candidateLadder,
	clampRange,
	defaultRange,
	frameSchedule,
	nativeFps,
	outputDuration,
	predictBytes,
	sampleIndexes
} from './plan.ts';

const range = (startMs: number, endMs: number, speed = 1) => ({ id: 'r', startMs, endMs, speed });

describe('ranges', () => {
	it('keeps the output within 10 seconds', () => {
		expect(clampRange(range(0, 30_000), 60_000).endMs).toBe(10_000);
		expect(clampRange(range(0, 30_000, 2), 60_000).endMs).toBe(20_000);
		expect(clampRange(range(5000, 30_000), 60_000, 'end').startMs).toBe(20_000);
	});

	it('stays inside the source and keeps a minimum span', () => {
		expect(clampRange(range(-50, 99_000), 4000)).toMatchObject({ startMs: 0, endMs: 4000 });
		expect(clampRange(range(1000, 1000), 4000)).toMatchObject({ startMs: 1000, endMs: 1200 });
		expect(clampRange(range(4000, 4000), 4000, 'start')).toMatchObject({ startMs: 3800, endMs: 4000 });
	});

	it('creates default ranges after the previous one', () => {
		const first = defaultRange(8000);
		expect(first).toMatchObject({ startMs: 0, endMs: 3000, speed: 1 });
		expect(defaultRange(8000, first)).toMatchObject({ startMs: 3000, endMs: 6000 });
		expect(defaultRange(1500)).toMatchObject({ startMs: 0, endMs: 1500 });
		expect(outputDuration(range(0, 3000, 1.5))).toBe(2000);
	});
});

describe('frame schedule', () => {
	it('spreads frames evenly and sums to the output duration', () => {
		const schedule = frameSchedule(range(1000, 4000), 10);
		expect(schedule.sourceMs).toHaveLength(30);
		expect(schedule.sourceMs[0]).toBe(1000);
		expect(schedule.durations.reduce((a, b) => a + b, 0)).toBe(3000);
	});

	it('maps output time through the speed', () => {
		const schedule = frameSchedule(range(0, 4000, 2), 10);
		expect(schedule.sourceMs).toHaveLength(20);
		expect(schedule.sourceMs[1]).toBe(200);
	});

	it('produces at least one frame', () => {
		expect(frameSchedule(range(0, 10), 5).sourceMs).toHaveLength(1);
	});
});

describe('candidate ladder', () => {
	it('alternates quality and fps reductions', () => {
		const ladder = candidateLadder(30);
		expect(ladder.slice(0, 4)).toEqual([
			{ quality: 82, fps: 20 },
			{ quality: 72, fps: 20 },
			{ quality: 72, fps: 15 },
			{ quality: 62, fps: 15 }
		]);
		expect(ladder.at(-1)).toEqual({ quality: 24, fps: 5 });
	});

	it('never exceeds the source fps', () => {
		const ladder = candidateLadder(8.3);
		expect(Math.max(...ladder.map((c) => c.fps))).toBe(8);
	});
});

describe('estimates', () => {
	it('predicts bytes and picks evenly spread samples', () => {
		expect(predictBytes(1000, 10)).toBe(10_304);
		expect(sampleIndexes(3, 6)).toEqual([0, 1, 2]);
		expect(sampleIndexes(100, 4)).toEqual([12, 37, 62, 87]);
		expect(nativeFps([100, 100])).toBe(10);
		expect(nativeFps([])).toBe(20);
	});
});
