import type { QualityMode } from './doc.ts';

export type EncodeRequest =
	| { id: number; kind: 'still'; pixels: ImageData; quality: QualityMode; limit: number }
	| { id: number; kind: 'frame'; pixels: ImageData; quality: number };

export type EncodeResponse =
	| { id: number; status: 'done'; buffer: ArrayBuffer; lossless: boolean; quality: number; fits: boolean }
	| { id: number; status: 'skipped' }
	| { id: number; status: 'failed' };
