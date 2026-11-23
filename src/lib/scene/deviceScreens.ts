export const DEVICE_SCREENS = {
	laptop: { width: 1280, height: 720 },
	phone: { width: 390, height: 930 },
	embedded: { width: 480, height: 336 }
} as const;

// Back to front in the holder. Only Card can be brought toward the camera.
export const CARD_MESH_NAMES = ['Card.002', 'Card.001', 'Card'] as const;
export type CardMeshName = (typeof CARD_MESH_NAMES)[number];
