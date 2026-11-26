import type { Shape } from './doc.ts';
import { shapeOps, type PathOp } from './shapes.ts';

const ICON_FRAME = { left: 3, top: 3, size: 18 };
const IDENTITY = { x: 0, y: 0, scale: 1, rotation: 0 };

function round(value: number): string {
	return String(Math.round(value * 100) / 100);
}

export function opsToSvg(ops: PathOp[]): string {
	return ops
		.map((op) =>
			op[0] === 'Z'
				? 'Z'
				: `${op[0]}${op
						.slice(1)
						.map((v) => round(v as number))
						.join(' ')}`
		)
		.join('');
}

export function shapeIcon(shape: Shape): string {
	return opsToSvg(shapeOps(shape, ICON_FRAME, IDENTITY));
}

export const LASSO_ICON = 'M6 15c-2-4 1-10 7-10s8 5 6 9-6 5-9 4-3-3 0-4';
