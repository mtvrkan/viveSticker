export type ThemeChoice = 'system' | 'light' | 'dark';

// Same key as the pre-paint script in app.html.
const storageKey = 'vivesticker.theme';

/** The visitor's pinned theme (or `system`) and what the system currently prefers. */
export const theme = $state<{ choice: ThemeChoice; systemDark: boolean }>({
	choice: 'system',
	systemDark: false
});

let watching = false;

/** Reads the theme app.html applied before first paint and follows system changes. Call on mount. */
export function syncTheme(): void {
	const pinned = document.documentElement.dataset.theme;
	theme.choice = pinned === 'light' || pinned === 'dark' ? pinned : 'system';
	if (watching) return;
	watching = true;
	const query = matchMedia('(prefers-color-scheme: dark)');
	theme.systemDark = query.matches;
	query.addEventListener('change', (event) => (theme.systemDark = event.matches));
}

export function isDark(): boolean {
	return theme.choice === 'dark' || (theme.choice === 'system' && theme.systemDark);
}

export function chooseTheme(next: ThemeChoice): void {
	theme.choice = next;
	const root = document.documentElement;
	if (next === 'system') delete root.dataset.theme;
	else root.dataset.theme = next;
	try {
		if (next === 'system') localStorage.removeItem(storageKey);
		else localStorage.setItem(storageKey, next);
	} catch {
		// Storage blocked: the choice lasts for this page view only.
	}
}

/** Flips between light and dark; landing on what the system prefers goes back to following it. */
export function toggleTheme(): void {
	const next = isDark() ? 'light' : 'dark';
	chooseTheme(next === (theme.systemDark ? 'dark' : 'light') ? 'system' : next);
}
