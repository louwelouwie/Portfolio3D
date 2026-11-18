export const themeStorageKey = 'portfolio-outer-theme';

export function readDarkMode() {
	try {
		return localStorage.getItem(themeStorageKey) === 'dark';
	} catch {
		return false;
	}
}

export function saveDarkMode(darkMode: boolean) {
	try {
		localStorage.setItem(themeStorageKey, darkMode ? 'dark' : 'light');
	} catch {
		// The current page can still switch themes when storage is unavailable.
	}
}
