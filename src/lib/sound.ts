export const soundStorageKey = 'portfolio-sound-enabled';

export function readSoundEnabled() {
	try {
		return localStorage.getItem(soundStorageKey) === 'true';
	} catch {
		return false;
	}
}

export function saveSoundEnabled(enabled: boolean) {
	try {
		localStorage.setItem(soundStorageKey, String(enabled));
	} catch {
		// The sound control still works when storage is unavailable.
	}
}
