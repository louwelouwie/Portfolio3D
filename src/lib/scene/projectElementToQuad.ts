type Point = { x: number; y: number };
export type ScreenQuad = readonly [Point, Point, Point, Point];

/** Map an HTML element onto four projected corners. */
export function projectElementToQuad(
	[topLeft, topRight, bottomRight, bottomLeft]: ScreenQuad,
	width: number,
	height: number
): string {
	const dx1 = topRight.x - bottomRight.x;
	const dx2 = bottomLeft.x - bottomRight.x;
	const dx3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;
	const dy1 = topRight.y - bottomRight.y;
	const dy2 = bottomLeft.y - bottomRight.y;
	const dy3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;
	const determinant = dx1 * dy2 - dx2 * dy1;
	const perspectiveX = Math.abs(determinant) > 1e-10 ? (dx3 * dy2 - dx2 * dy3) / determinant : 0;
	const perspectiveY = Math.abs(determinant) > 1e-10 ? (dx1 * dy3 - dx3 * dy1) / determinant : 0;
	const horizontalX = topRight.x - topLeft.x + perspectiveX * topRight.x;
	const horizontalY = topRight.y - topLeft.y + perspectiveX * topRight.y;
	const verticalX = bottomLeft.x - topLeft.x + perspectiveY * bottomLeft.x;
	const verticalY = bottomLeft.y - topLeft.y + perspectiveY * bottomLeft.y;

	return `matrix3d(${horizontalX / width},${horizontalY / width},0,${perspectiveX / width},${verticalX / height},${verticalY / height},0,${perspectiveY / height},0,0,1,0,${topLeft.x},${topLeft.y},0,1)`;
}
