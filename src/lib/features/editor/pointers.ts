import type { Point } from './doc.ts';

export class PointerSet {
	private readonly points = new Map<number, Point>();

	get size(): number {
		return this.points.size;
	}

	has(id: number): boolean {
		return this.points.has(id);
	}

	get(id: number): Point | undefined {
		return this.points.get(id);
	}

	set(id: number, point: Point): void {
		this.points.set(id, point);
	}

	delete(id: number): boolean {
		return this.points.delete(id);
	}

	list(): Point[] {
		return [...this.points.values()];
	}
}
