import * as THREE from 'three';
import {
	createForegroundPresentation,
	type SurfaceCorners
} from './createForegroundPresentation.js';

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
	const margin = 0.006;
	const left = paperBounds.min.x + margin;
	const right = paperBounds.max.x - margin;
	back += margin;
	front -= margin;
	if (front <= back || right <= left) return;
	const corners: SurfaceCorners = [
		new THREE.Vector3(left, topY, back),
		new THREE.Vector3(right, topY, back),
		new THREE.Vector3(right, topY, front),
		new THREE.Vector3(left, topY, front)
	];
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
		aspect: ((right - left) * paper.scale.x) / ((front - back) * paper.scale.z),
		presentation: createForegroundPresentation(paper, corners, foreground, {
			ejectDistance,
			verticalFill: 0.7
		})
	};
}
