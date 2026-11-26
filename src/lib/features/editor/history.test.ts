import { describe, expect, it } from 'vitest';
import { createDoc } from './doc.ts';
import { EditorHistory } from './history.svelte.ts';

const moved = (history: EditorHistory, x: number) => ({
	...history.doc,
	transform: { ...history.doc.transform, x }
});

describe('EditorHistory', () => {
	it('undoes and redoes committed steps', () => {
		const history = new EditorHistory(createDoc());
		history.apply(moved(history, 0.1));
		history.apply(moved(history, 0.2));
		history.undo();
		expect(history.doc.transform.x).toBe(0.1);
		history.redo();
		expect(history.doc.transform.x).toBe(0.2);
	});

	it('groups previews into one step', () => {
		const history = new EditorHistory(createDoc());
		history.preview(moved(history, 0.1));
		history.preview(moved(history, 0.3));
		history.commit();
		history.undo();
		expect(history.doc.transform.x).toBe(0);
		expect(history.canUndo).toBe(false);
	});

	it('clears redo after a new change and ignores no-op commits', () => {
		const history = new EditorHistory(createDoc());
		history.apply(moved(history, 0.1));
		history.undo();
		history.apply(moved(history, 0.4));
		expect(history.canRedo).toBe(false);
		history.commit();
		history.undo();
		expect(history.doc.transform.x).toBe(0);
	});
});
