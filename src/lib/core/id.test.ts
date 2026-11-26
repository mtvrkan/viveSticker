import { afterEach, describe, expect, it, vi } from 'vitest';
import { newId } from './id.ts';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('newId', () => {
	it('uses the native generator when the page is a secure context', () => {
		const native = vi.spyOn(crypto, 'randomUUID');

		const id = newId();

		expect(native).toHaveBeenCalledOnce();
		expect(id).toMatch(UUID_V4);
	});

	it('builds a version 4 id without randomUUID, as on plain http over a local network', () => {
		const real = globalThis.crypto;
		vi.stubGlobal('crypto', {
			getRandomValues: (array: Uint8Array<ArrayBuffer>) => real.getRandomValues(array)
		});

		const id = newId();

		expect(id).toMatch(UUID_V4);
	});

	it('returns a different id on every call in the fallback path', () => {
		const real = globalThis.crypto;
		vi.stubGlobal('crypto', {
			getRandomValues: (array: Uint8Array<ArrayBuffer>) => real.getRandomValues(array)
		});

		const ids = new Set(Array.from({ length: 50 }, () => newId()));

		expect(ids.size).toBe(50);
	});
});
