export type MediaKind = 'image' | 'animated-image' | 'video';

export type SourceMedia = {
	id: string;
	blob: Blob;
	name: string;
	mime: string;
	kind: MediaKind;
	bytes: number;
	width: number;
	height: number;
	durationMs: number | null;
	frameCount: number | null;
	objectUrl: string;
};

export type ImportErrorReason =
	| 'unsupported-type'
	| 'too-large'
	| 'empty-file'
	| 'decode-failed'
	| 'fetch-blocked'
	| 'fetch-failed'
	| 'invalid-url'
	| 'not-media'
	| 'x-unavailable';

export type ImportState =
	| { status: 'idle' }
	| { status: 'loading'; name: string }
	| { status: 'ready'; media: SourceMedia }
	| { status: 'error'; reason: ImportErrorReason };

export type StickerKind = 'static' | 'animated';

export type Sticker = {
	id: string;
	kind: StickerKind;
	webp: Blob;
	bytes: number;
	durationMs: number | null;
	emojis: string[];
};

export type StickerPack = {
	id: string;
	name: string;
	publisher: string;
	tray: Blob | null;
	stickers: Sticker[];
};
