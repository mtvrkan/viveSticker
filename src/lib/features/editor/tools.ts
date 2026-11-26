import type { MessageKey } from '#lib/i18n/tr.ts';

export type CanvasTool = 'move' | 'lasso' | 'pick' | 'brush';

export const TOOL_HINTS: Record<CanvasTool, MessageKey> = {
	move: 'editorCanvasHint',
	lasso: 'lassoHint',
	pick: 'cutoutPickHint',
	brush: 'drawHint'
};
