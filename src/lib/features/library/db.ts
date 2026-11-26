import { newId } from '#lib/core/id.ts';
import type { StickerKind } from '#lib/core/types.ts';

export type LibrarySticker = {
	id: string;
	kind: StickerKind;
	webp: Blob;
	bytes: number;
	durationMs: number | null;
	name: string;
	createdAt: number;
};

type StoredSticker = Omit<LibrarySticker, 'webp'> & { data: ArrayBuffer };

export type LibraryPack = {
	id: string;
	name: string;
	publisher: string;
	kind: StickerKind;
	stickerIds: string[];
	updatedAt: number;
};

const DB_NAME = 'vivesticker';
const DB_VERSION = 1;
const STICKERS = 'stickers';
const PACKS = 'packs';

let connection: Promise<IDBDatabase> | null = null;

function done<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('idb-request-failed'));
	});
}

function committed(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onabort = () => reject(transaction.error ?? new Error('idb-transaction-aborted'));
		transaction.onerror = () => reject(transaction.error ?? new Error('idb-transaction-failed'));
	});
}

function open(): Promise<IDBDatabase> {
	connection ??= new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STICKERS)) db.createObjectStore(STICKERS, { keyPath: 'id' });
			if (!db.objectStoreNames.contains(PACKS)) db.createObjectStore(PACKS, { keyPath: 'id' });
		};
		request.onsuccess = () => {
			const db = request.result;
			db.onversionchange = () => {
				db.close();
				connection = null;
			};
			resolve(db);
		};
		request.onerror = () => reject(request.error ?? new Error('idb-open-failed'));
		request.onblocked = () => reject(new Error('idb-blocked'));
	});
	connection.catch(() => (connection = null));
	return connection;
}

export async function saveSticker(
	input: Omit<LibrarySticker, 'id' | 'createdAt' | 'bytes'>
): Promise<LibrarySticker> {
	const sticker: LibrarySticker = {
		...input,
		id: newId(),
		bytes: input.webp.size,
		createdAt: Date.now()
	};
	const { webp, ...meta } = sticker;
	const record: StoredSticker = { ...meta, data: await webp.arrayBuffer() };
	const db = await open();
	const transaction = db.transaction(STICKERS, 'readwrite');
	transaction.objectStore(STICKERS).put(record);
	await committed(transaction);
	return sticker;
}

export async function listStickers(): Promise<LibrarySticker[]> {
	const db = await open();
	const all = await done(
		db.transaction(STICKERS).objectStore(STICKERS).getAll() as IDBRequest<StoredSticker[]>
	);
	return all
		.map(({ data, ...meta }) => ({ ...meta, webp: new Blob([data], { type: 'image/webp' }) }))
		.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listPacks(): Promise<LibraryPack[]> {
	const db = await open();
	const all = await done(db.transaction(PACKS).objectStore(PACKS).getAll() as IDBRequest<LibraryPack[]>);
	return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function savePack(pack: LibraryPack): Promise<void> {
	const db = await open();
	const transaction = db.transaction(PACKS, 'readwrite');
	transaction.objectStore(PACKS).put({ ...pack, stickerIds: [...pack.stickerIds], updatedAt: Date.now() });
	await committed(transaction);
}

export async function deletePack(id: string): Promise<void> {
	const db = await open();
	const transaction = db.transaction(PACKS, 'readwrite');
	transaction.objectStore(PACKS).delete(id);
	await committed(transaction);
}

export async function deleteStickers(ids: string[]): Promise<void> {
	const removed = new Set(ids);
	const db = await open();
	const transaction = db.transaction([STICKERS, PACKS], 'readwrite');
	const stickers = transaction.objectStore(STICKERS);
	for (const id of ids) stickers.delete(id);
	const packs = transaction.objectStore(PACKS);
	const all = await done(packs.getAll() as IDBRequest<LibraryPack[]>);
	for (const pack of all) {
		const kept = pack.stickerIds.filter((id) => !removed.has(id));
		if (kept.length !== pack.stickerIds.length) packs.put({ ...pack, stickerIds: kept });
	}
	await committed(transaction);
}
