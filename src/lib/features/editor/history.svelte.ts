import { cloneDoc, createDoc, sameDoc, type EditorDoc } from './doc.ts';

const HISTORY_LIMIT = 100;

export class EditorHistory {
	doc = $state<EditorDoc>(createDoc());
	private past = $state<EditorDoc[]>([]);
	private future = $state<EditorDoc[]>([]);
	private committed: EditorDoc;

	readonly canUndo = $derived(this.past.length > 0);
	readonly canRedo = $derived(this.future.length > 0);

	constructor(initial: EditorDoc) {
		this.doc = cloneDoc(initial);
		this.committed = cloneDoc(initial);
	}

	preview(doc: EditorDoc): void {
		this.doc = doc;
	}

	commit(): void {
		if (sameDoc(this.committed, this.doc)) return;
		this.past = [...this.past.slice(-(HISTORY_LIMIT - 1)), this.committed];
		this.future = [];
		this.committed = cloneDoc(this.doc);
	}

	apply(doc: EditorDoc): void {
		this.doc = doc;
		this.commit();
	}

	undo(): void {
		this.commit();
		const previous = this.past.at(-1);
		if (!previous) return;
		this.past = this.past.slice(0, -1);
		this.future = [...this.future, cloneDoc(this.doc)];
		this.restore(previous);
	}

	redo(): void {
		const next = this.future.at(-1);
		if (!next) return;
		this.future = this.future.slice(0, -1);
		this.past = [...this.past, cloneDoc(this.doc)];
		this.restore(next);
	}

	private restore(doc: EditorDoc): void {
		this.doc = cloneDoc(doc);
		this.committed = cloneDoc(doc);
	}
}
