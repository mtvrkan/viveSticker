import {
	createVideoElement,
	FramesMotion,
	prepareVideo,
	seekVideo,
	VideoMotion,
	type MotionFrame,
	type MotionSource
} from './motion.ts';
import type { ClipRange } from './plan.ts';

export type FrameListener = (frame: MotionFrame, ms: number) => void;

export class MotionPlayer {
	private frameId = 0;
	private lastTick = 0;
	private time = 0;
	private lastIndex = -1;
	private video: HTMLVideoElement | null = null;
	private range: ClipRange | null = null;
	private active = false;

	constructor(
		private readonly source: MotionSource,
		private readonly onframe: FrameListener
	) {}

	get playing(): boolean {
		return this.active;
	}

	async attach(host: HTMLElement): Promise<void> {
		if (!(this.source instanceof VideoMotion)) return;
		const video = createVideoElement(this.source.url);
		video.className = 'pointer-events-none absolute size-px opacity-0';
		video.loop = false;
		host.append(video);
		this.video = video;
		await prepareVideo(video);
	}

	setRange(range: ClipRange): void {
		this.range = range;
		if (this.video) this.video.playbackRate = range.speed;
	}

	async play(): Promise<void> {
		if (!this.range || this.active) return;
		this.active = true;
		if (this.time < this.range.startMs || this.time >= this.range.endMs) this.time = this.range.startMs;
		if (this.video) {
			this.video.playbackRate = this.range.speed;
			await seekVideo(this.video, this.time);
			try {
				await this.video.play();
			} catch {
				this.active = false;
				return;
			}
		}
		this.lastTick = performance.now();
		this.frameId = requestAnimationFrame((now) => this.tick(now));
	}

	pause(): void {
		this.active = false;
		cancelAnimationFrame(this.frameId);
		this.video?.pause();
	}

	async seek(ms: number): Promise<void> {
		this.pause();
		this.time = ms;
		this.lastIndex = -1;
		if (this.video) {
			await seekVideo(this.video, ms);
			this.emitVideo();
		} else if (this.source instanceof FramesMotion) {
			this.onframe(this.source.frameSync(ms), ms);
		}
	}

	dispose(): void {
		this.pause();
		if (this.video) {
			this.video.removeAttribute('src');
			this.video.load();
			this.video.remove();
			this.video = null;
		}
	}

	private emitVideo() {
		if (!this.video) return;
		this.onframe({ image: this.video, width: this.source.width, height: this.source.height }, this.time);
	}

	private tick(now: number) {
		if (!this.active || !this.range) return;
		const { startMs, endMs, speed } = this.range;
		if (this.video) {
			this.time = this.video.currentTime * 1000;
			if (this.time >= endMs - 1 || this.time < startMs - 50 || this.video.ended) {
				this.time = startMs;
				this.video.currentTime = startMs / 1000;
				if (this.video.paused) void this.video.play().catch(() => this.pause());
			}
			this.emitVideo();
		} else if (this.source instanceof FramesMotion) {
			this.time += (now - this.lastTick) * speed;
			if (this.time >= endMs) this.time = startMs + ((this.time - startMs) % Math.max(1, endMs - startMs));
			const index = this.source.frameIndex(this.time);
			if (index !== this.lastIndex) {
				this.lastIndex = index;
				this.onframe(this.source.frameSync(this.time), this.time);
			}
		}
		this.lastTick = now;
		this.frameId = requestAnimationFrame((next) => this.tick(next));
	}
}
