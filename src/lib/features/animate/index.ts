export { MotionFailure, openMotion, type MotionFrame, type MotionSource } from './motion.ts';
export { MotionPlayer } from './player.ts';
export {
	candidateLadder,
	clampRange,
	defaultRange,
	ESTIMATE_HEADROOM,
	frameSchedule,
	outputDuration,
	predictBytes,
	sampleIndexes,
	SPEEDS,
	type Candidate,
	type ClipRange
} from './plan.ts';
export { muxAnimatedWebp, readStillWebp } from './webp-mux.ts';
