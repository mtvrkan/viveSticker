function blurLine(
	source: Float32Array,
	target: Float32Array,
	start: number,
	step: number,
	count: number,
	radius: number
): void {
	const width = radius * 2 + 1;
	let sum = 0;
	for (let i = -radius; i <= radius; i++)
		sum += source[start + Math.min(count - 1, Math.max(0, i)) * step] as number;
	for (let i = 0; i < count; i++) {
		target[start + i * step] = sum / width;
		const outIndex = Math.max(0, i - radius);
		const inIndex = Math.min(count - 1, i + radius + 1);
		sum += (source[start + inIndex * step] as number) - (source[start + outIndex * step] as number);
	}
}

export function blurAlpha(data: Uint8ClampedArray, width: number, height: number, radius: number): void {
	const r = Math.round(radius);
	if (r < 1 || width === 0 || height === 0) return;
	const alpha = new Float32Array(width * height);
	for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3] as number;
	const temp = new Float32Array(alpha.length);
	for (let y = 0; y < height; y++) blurLine(alpha, temp, y * width, 1, width, r);
	for (let x = 0; x < width; x++) blurLine(temp, alpha, x, width, height, r);
	for (let i = 0; i < alpha.length; i++) data[i * 4 + 3] = alpha[i] as number;
}
