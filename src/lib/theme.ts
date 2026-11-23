import { getPosition, getTimes } from 'suncalc';

export type SessionTheme = 'light' | 'dark';
const sessionThemeKey = 'portfolio-outer-theme-session';

// The KNMI De Bilt station is a stable reference point near the middle of the Netherlands.
const deBilt = { latitude: 52.100833, longitude: 5.1775 };

export function readSessionTheme(): SessionTheme | null {
	try {
		const value = sessionStorage.getItem(sessionThemeKey);
		return value === 'light' || value === 'dark' ? value : null;
	} catch {
		return null;
	}
}

export function saveSessionTheme(theme: SessionTheme) {
	try {
		sessionStorage.setItem(sessionThemeKey, theme);
	} catch {
		// The current page can still switch themes when storage is unavailable.
	}
}

export function isDarkInNetherlands(now = new Date()) {
	const { sunrise, sunset } = getTimes(now, deBilt.latitude, deBilt.longitude);
	if (!sunrise || !sunset) return getPosition(now, deBilt.latitude, deBilt.longitude).altitude < 0;
	return now < sunrise || now >= sunset;
}
