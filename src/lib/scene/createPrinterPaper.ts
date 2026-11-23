import * as THREE from 'three';
import {
	createForegroundPresentation,
	type SurfaceCorners
} from './createForegroundPresentation.js';

// The CV is a portrait A4 page.
const CV_ASPECT = 210 / 297;

export function createPrinterPaper(
	printer: THREE.Mesh,
	paper: THREE.Mesh,
	foreground: THREE.Group
) {
	printer.geometry.computeBoundingBox();
	paper.geometry.computeBoundingBox();
	const printerBounds = printer.geometry.boundingBox!;
	const paperBounds = paper.geometry.boundingBox!;
	const positions = paper.geometry.getAttribute('position');
	const topY = paperBounds.max.y;
	let back = Infinity;
	let front = -Infinity;
	// Only the top plateau is planar. The lower vertices form the curl and the sheet thickness.
	for (let index = 0; index < positions.count; index++) {
		if (positions.getY(index) < topY - 0.0001) continue;
		back = Math.min(back, positions.getZ(index));
		front = Math.max(front, positions.getZ(index));
	}
	const left = paperBounds.min.x;
	const right = paperBounds.max.x;
	if (front <= back || right <= left) return;
	const face = (leftX: number, rightX: number, backZ: number, frontZ: number): SurfaceCorners => [
		new THREE.Vector3(leftX, topY, backZ),
		new THREE.Vector3(rightX, topY, backZ),
		new THREE.Vector3(rightX, topY, frontZ),
		new THREE.Vector3(leftX, topY, frontZ)
	];
	const width = (right - left) * paper.scale.x;
	const length = (front - back) * paper.scale.z;
	const printWidth = Math.min(width, length * CV_ASPECT);
	const printLength = printWidth / CV_ASPECT;
	const centerX = (left + right) / 2;
	const centerZ = (back + front) / 2;
	const halfWidth = printWidth / (2 * paper.scale.x);
	const halfLength = printLength / (2 * paper.scale.z);
	const corners = face(
		centerX - halfWidth,
		centerX + halfWidth,
		centerZ - halfLength,
		centerZ + halfLength
	);
	const slot = printerBounds.max.z;
	paper.position.z = slot + 0.006 - paperBounds.max.z * paper.scale.z;
	const ejectDistance = slot + 0.008 - (paper.position.z + paperBounds.min.z * paper.scale.z);
	// The GLB shares this material with other props. Only the paper changes its render depth.
	paper.material = Array.isArray(paper.material)
		? paper.material.map((entry) => entry.clone())
		: paper.material.clone();
	return {
		mesh: paper,
		corners,
		aspect: CV_ASPECT,
		presentation: createForegroundPresentation(paper, face(left, right, back, front), foreground, {
			ejectDistance,
			verticalFill: 0.7
		})
	};
}
