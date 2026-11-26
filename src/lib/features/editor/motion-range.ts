import { ANIMATED_MAX_MS } from '#lib/core/whatsapp.ts';
import { clampRange, defaultRange, type ClipRange } from '#lib/features/animate/index.ts';

export function initialRange(durationMs: number): ClipRange {
	if (durationMs <= ANIMATED_MAX_MS) {
		const range = defaultRange(durationMs);
		return clampRange({ ...range, startMs: 0, endMs: durationMs }, durationMs);
	}
	return defaultRange(durationMs);
}
