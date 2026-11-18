import type { IconPosition } from './iconPosition.js';

export const iconSize = 96;
const gap = 8;

type Rectangle = IconPosition & { width: number; height: number };

/** Find the closest available position within the desktop, keeping a small gap between icons. */
export function placeIcon(
	desired: IconPosition,
	occupied: Rectangle[],
	bounds: { width: number; height: number },
	width = iconSize,
	height = iconSize
): IconPosition {
	const maxX = Math.max(0, bounds.width - width);
	const maxY = Math.max(0, bounds.height - height);
	const clampX = (value: number) => Math.max(0, Math.min(value, maxX));
	const clampY = (value: number) => Math.max(0, Math.min(value, maxY));
	const x = clampX(desired.x);
	const y = clampY(desired.y);
	const isFree = (candidate: IconPosition) =>
		occupied.every(
			(other) =>
				candidate.x + width + gap <= other.x ||
				candidate.x >= other.x + other.width + gap ||
				candidate.y + height + gap <= other.y ||
				candidate.y >= other.y + other.height + gap
		);
	if (isFree({ x, y })) return { x, y };

	const xs = [x, 0, maxX];
	const ys = [y, 0, maxY];
	for (const other of occupied) {
		xs.push(clampX(other.x - width - gap), clampX(other.x + other.width + gap));
		ys.push(clampY(other.y - height - gap), clampY(other.y + other.height + gap));
	}
	const candidates = xs.flatMap((candidateX) =>
		ys.map((candidateY) => ({ x: candidateX, y: candidateY }))
	);
	candidates.sort((a, b) => (a.x - x) ** 2 + (a.y - y) ** 2 - ((b.x - x) ** 2 + (b.y - y) ** 2));
	return candidates.find(isFree) ?? { x, y };
}
