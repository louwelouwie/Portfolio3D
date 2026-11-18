export const windowModeKey = 'portfolio3d-window-maximized';

export function readWindowMaximized() {
	try {
		return localStorage.getItem(windowModeKey) !== 'false';
	} catch {
		return true;
	}
}

export function saveWindowMaximized(maximized: boolean) {
	try {
		localStorage.setItem(windowModeKey, String(maximized));
	} catch {
		// The window still changes mode when browser storage is unavailable.
	}
}
