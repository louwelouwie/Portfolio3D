export type IconPosition = { x: number; y: number };

export const iconPositionKey = (id: string) => `portfolio3d-icon-${id}`;

export function parseIconPosition(value: string | null): IconPosition | null {
	if (!value) return null;
	try {
		const position: unknown = JSON.parse(value);
		if (
			position &&
			typeof position === 'object' &&
			'x' in position &&
			'y' in position &&
			typeof position.x === 'number' &&
			typeof position.y === 'number' &&
			Number.isFinite(position.x) &&
			Number.isFinite(position.y)
		)
			return { x: position.x, y: position.y };
	} catch {
		// Ignore positions from old or invalid storage entries.
	}
	return null;
}

export function readIconPosition(id: string): IconPosition | null {
	try {
		return parseIconPosition(localStorage.getItem(iconPositionKey(id)));
	} catch {
		return null;
	}
}

export function saveIconPosition(id: string, position: IconPosition) {
	try {
		localStorage.setItem(iconPositionKey(id), JSON.stringify(position));
	} catch {
		// Dragging still works when browser storage is unavailable.
	}
}
