export const themeStorageKey = 'portfolio-theme';

export function readDarkMode() {
	try {
		return localStorage.getItem(themeStorageKey) !== 'light';
	} catch {
		return true;
	}
}

export function saveDarkMode(darkMode: boolean) {
	try {
		localStorage.setItem(themeStorageKey, darkMode ? 'dark' : 'light');
	} catch {
		// The current page can still switch themes when storage is unavailable.
	}
}
