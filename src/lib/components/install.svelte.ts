type InstallPromptEvent = Event & { prompt(): Promise<void> };
type InstallWindow = Window & { __installPrompt?: InstallPromptEvent };

let offer: InstallPromptEvent | null = null;

/** True while the browser offers to install the app (Chromium only; Safari has no prompt API). */
export const install = $state({ available: false });

function keep(event: Event) {
	event.preventDefault();
	offer = event as InstallPromptEvent;
	install.available = true;
}

function forget() {
	offer = null;
	install.available = false;
	(window as InstallWindow).__installPrompt = undefined;
}

/** Picks up an offer app.html caught before hydration and listens for later ones. Call on mount. */
export function watchInstall(): () => void {
	const early = (window as InstallWindow).__installPrompt;
	if (early) {
		offer = early;
		install.available = true;
	}
	addEventListener('beforeinstallprompt', keep);
	addEventListener('appinstalled', forget);
	return () => {
		removeEventListener('beforeinstallprompt', keep);
		removeEventListener('appinstalled', forget);
	};
}

export async function promptInstall(): Promise<void> {
	const current = offer;
	if (!current) return;
	// An offer can be shown only once; the browser sends a fresh one if the visitor declines.
	forget();
	try {
		await current.prompt();
	} catch {
		// The browser withdrew the offer; the button is already hidden.
	}
}
