export class DecodeError extends Error {
	constructor(readonly reason: 'invalid' | 'too-large' | 'not-animated') {
		super(reason);
	}
}
