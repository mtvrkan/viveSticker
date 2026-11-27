import type { Page } from '@playwright/test';

function lzwUncompressed(indices: number[]): number[] {
	const clear = 256;
	const end = 257;
	const codes: number[] = [clear];
	let run = 0;
	for (const index of indices) {
		if (run === 254) {
			codes.push(clear);
			run = 0;
		}
		codes.push(index);
		run++;
	}
	codes.push(end);
	const bytes: number[] = [];
	let buffer = 0;
	let bits = 0;
	for (const code of codes) {
		buffer |= code << bits;
		bits += 9;
		while (bits >= 8) {
			bytes.push(buffer & 0xff);
			buffer >>>= 8;
			bits -= 8;
		}
	}
	if (bits > 0) bytes.push(buffer & 0xff);
	return bytes;
}

export function animatedGif(width: number, height: number, frameCount: number, delayCs = 10): Buffer {
	const out: number[] = [];
	const u16 = (value: number) => out.push(value & 0xff, (value >> 8) & 0xff);
	out.push(...Buffer.from('GIF89a'));
	u16(width);
	u16(height);
	out.push(0xf7, 0, 0);
	for (let i = 0; i < 256; i++) out.push(i, (i * 3) & 0xff, 255 - i);
	out.push(0x21, 0xff, 0x0b, ...Buffer.from('NETSCAPE2.0'), 0x03, 0x01, 0x00, 0x00, 0x00);
	for (let frame = 0; frame < frameCount; frame++) {
		out.push(0x21, 0xf9, 0x04, 0x04);
		u16(delayCs);
		out.push(0x00, 0x00, 0x2c);
		u16(0);
		u16(0);
		u16(width);
		u16(height);
		out.push(0x00, 0x08);
		const indices: number[] = [];
		for (let y = 0; y < height; y++)
			for (let x = 0; x < width; x++) {
				const dx = x - ((frame * 7) % width);
				const dy = y - height / 2;
				indices.push(dx * dx + dy * dy < 100 ? 255 : (x + y + frame * 9) & 0xff);
			}
		const data = lzwUncompressed(indices);
		for (let i = 0; i < data.length; i += 255) {
			const block = data.slice(i, i + 255);
			out.push(block.length, ...block);
		}
		out.push(0x00);
	}
	out.push(0x3b);
	return Buffer.from(out);
}

export async function recordedVideo(
	page: Page
): Promise<{ buffer: Buffer; mime: string; name: string } | null> {
	const result = await page.evaluate(async () => {
		// Some WebKit builds (Windows, Linux CI) ship without MediaRecorder; the caller skips then.
		if (typeof MediaRecorder === 'undefined') return null;
		const types = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
		const type = types.find((candidate) => MediaRecorder.isTypeSupported(candidate));
		if (!type) return null;
		const canvas = document.createElement('canvas');
		canvas.width = 320;
		canvas.height = 240;
		const ctx = canvas.getContext('2d')!;
		const stream = canvas.captureStream(30);
		const recorder = new MediaRecorder(stream, { mimeType: type });
		const chunks: Blob[] = [];
		recorder.ondataavailable = (event) => chunks.push(event.data);
		const stopped = new Promise((resolve) => (recorder.onstop = resolve));
		recorder.start(100);
		const started = performance.now();
		await new Promise<void>((resolve) => {
			function draw(now: number) {
				const t = (now - started) / 1000;
				ctx.fillStyle = `hsl(${(t * 120) % 360} 70% 55%)`;
				ctx.fillRect(0, 0, 320, 240);
				ctx.fillStyle = '#fff';
				ctx.beginPath();
				ctx.arc(40 + t * 90, 120, 30, 0, Math.PI * 2);
				ctx.fill();
				if (t < 2.5) requestAnimationFrame(draw);
				else resolve();
			}
			requestAnimationFrame(draw);
		});
		recorder.stop();
		await stopped;
		const blob = new Blob(chunks, { type: type.split(';')[0] });
		const playable = await new Promise<boolean>((resolve) => {
			const probe = document.createElement('video');
			probe.muted = true;
			probe.onloadeddata = () => resolve(probe.videoWidth > 0);
			probe.onerror = () => resolve(false);
			setTimeout(() => resolve(false), 5000);
			probe.src = URL.createObjectURL(blob);
		});
		if (!playable) return null;
		const bytes = new Uint8Array(await blob.arrayBuffer());
		let binary = '';
		for (let i = 0; i < bytes.length; i += 0x8000)
			binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
		return { base64: btoa(binary), mime: blob.type };
	});
	if (!result) return null;
	const extension = result.mime.includes('mp4') ? 'mp4' : 'webm';
	return { buffer: Buffer.from(result.base64, 'base64'), mime: result.mime, name: `clip.${extension}` };
}
