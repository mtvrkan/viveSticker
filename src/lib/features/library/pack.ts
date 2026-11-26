import { createZip } from '#lib/core/binary/zip.ts';
import type { StickerKind } from '#lib/core/types.ts';
import {
	maxBytesFor,
	PACK_MAX_STICKERS,
	PACK_MIN_STICKERS,
	TRAY_MAX_BYTES,
	TRAY_SIZE
} from '#lib/core/whatsapp.ts';

export const PACK_TEXT_MAX = 128;

export type PackProblem =
	| 'name-missing'
	| 'name-too-long'
	| 'publisher-missing'
	| 'publisher-too-long'
	| 'too-few'
	| 'too-many'
	| 'mixed-kinds'
	| 'sticker-too-large';

export type PackDraft = {
	name: string;
	publisher: string;
	stickers: { kind: StickerKind; bytes: number }[];
};

export function packProblems(draft: PackDraft): PackProblem[] {
	const problems: PackProblem[] = [];
	const name = draft.name.trim();
	const publisher = draft.publisher.trim();
	if (!name) problems.push('name-missing');
	else if (name.length > PACK_TEXT_MAX) problems.push('name-too-long');
	if (!publisher) problems.push('publisher-missing');
	else if (publisher.length > PACK_TEXT_MAX) problems.push('publisher-too-long');
	if (draft.stickers.length < PACK_MIN_STICKERS) problems.push('too-few');
	if (draft.stickers.length > PACK_MAX_STICKERS) problems.push('too-many');
	if (new Set(draft.stickers.map((item) => item.kind)).size > 1) problems.push('mixed-kinds');
	if (draft.stickers.some((item) => item.bytes > maxBytesFor(item.kind))) problems.push('sticker-too-large');
	return problems;
}

export function packFileName(name: string): string {
	const base = name
		.trim()
		.replace(/[^\p{L}\p{N}_ -]+/gu, '')
		.replace(/\s+/g, '-')
		.slice(0, 60);
	return `${base || 'sticker-pack'}.wastickers`;
}

export function packEntries(name: string, publisher: string, tray: Uint8Array, stickers: Uint8Array[]) {
	const encoder = new TextEncoder();
	const width = String(stickers.length).length < 2 ? 2 : String(stickers.length).length;
	return [
		{ name: 'title.txt', data: encoder.encode(name.trim()) },
		{ name: 'author.txt', data: encoder.encode(publisher.trim()) },
		{ name: 'tray.png', data: tray },
		...stickers.map((data, index) => ({ name: `${String(index + 1).padStart(width, '0')}.webp`, data }))
	];
}

export async function renderTray(webp: Blob): Promise<Uint8Array> {
	const bitmap = await createImageBitmap(webp);
	const canvas = document.createElement('canvas');
	canvas.width = TRAY_SIZE;
	canvas.height = TRAY_SIZE;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('canvas-2d-unavailable');
	const ratio = Math.min(TRAY_SIZE / bitmap.width, TRAY_SIZE / bitmap.height);
	const width = bitmap.width * ratio;
	const height = bitmap.height * ratio;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(bitmap, (TRAY_SIZE - width) / 2, (TRAY_SIZE - height) / 2, width, height);
	bitmap.close();
	const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
	if (!png || png.size > TRAY_MAX_BYTES) throw new Error('tray-too-large');
	return new Uint8Array(await png.arrayBuffer());
}

export async function buildPack(name: string, publisher: string, webps: Blob[]): Promise<Blob> {
	const first = webps[0];
	if (!first) throw new Error('pack-empty');
	const [tray, ...stickers] = await Promise.all([
		renderTray(first),
		...webps.map(async (blob) => new Uint8Array(await blob.arrayBuffer()))
	]);
	const zip = createZip(packEntries(name, publisher, tray!, stickers));
	return new Blob([zip.slice().buffer], { type: 'application/zip' });
}
