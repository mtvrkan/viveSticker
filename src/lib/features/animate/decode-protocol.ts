export type DecodeRequest = { bytes: Uint8Array; maxPixels: number };

export type DecodeResponse =
	| { status: 'done'; width: number; height: number; frames: { rgba: ArrayBuffer; delayMs: number }[] }
	| { status: 'failed'; reason: 'too-large' | 'invalid' };
