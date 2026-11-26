export const STICKER_SIZE = 512;
export const STATIC_MAX_BYTES = 100 * 1024;
export const ANIMATED_MAX_BYTES = 500 * 1024;
export const ANIMATED_MAX_MS = 10_000;
export const ANIMATED_MIN_FRAME_MS = 8;
export const TRAY_SIZE = 96;
export const TRAY_MAX_BYTES = 50 * 1024;
export const PACK_MIN_STICKERS = 3;
export const PACK_MAX_STICKERS = 30;
export const INPUT_MAX_BYTES = 200 * 1024 * 1024;

export function maxBytesFor(kind: 'static' | 'animated'): number {
	return kind === 'animated' ? ANIMATED_MAX_BYTES : STATIC_MAX_BYTES;
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSeconds(ms: number): string {
	return `${(ms / 1000).toFixed(1)} s`;
}
