import * as THREE from 'three';
import cvPrintUrl from '#lib/assets/ChrisLouwerseCV-print.png?url';
import {
	createForegroundPresentation,
	type SurfaceCorners
} from './createForegroundPresentation.js';

function createPrintMaterial(aspect: number, anisotropy: number) {
	const material = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
	new THREE.ImageLoader().load(cvPrintUrl, (image) => {
		const canvas = document.createElement('canvas');
		canvas.width = image.naturalWidth;
		canvas.height = Math.round(canvas.width / aspect);
		const context = canvas.getContext('2d');
		if (!context) return;
		const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
		const width = image.naturalWidth * scale;
		const height = image.naturalHeight * scale;
		context.fillStyle = '#fff';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(
			image,
			(canvas.width - width) / 2,
			(canvas.height - height) / 2,
			width,
			height
		);
		const texture = new THREE.CanvasTexture(canvas);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.anisotropy = anisotropy;
		material.map = texture;
		material.needsUpdate = true;
	});
	return material;
}

export function createPrinterPaper(
	printer: THREE.Object3D,
	paper: THREE.Mesh,
	foreground: THREE.Group,
	anisotropy: number
) {
	paper.geometry.computeBoundingBox();
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
	// Combine the printer's body meshes in its local coordinates, excluding the moving sheet.
	printer.updateWorldMatrix(true, true);
	const worldToPrinter = printer.matrixWorld.clone().invert();
	const partToPrinter = new THREE.Matrix4();
	const partBounds = new THREE.Box3();
	let slot = -Infinity;
	printer.traverse((part) => {
		if (!(part instanceof THREE.Mesh) || part === paper) return;
		if (!part.geometry.boundingBox) part.geometry.computeBoundingBox();
		const bounds = part.geometry.boundingBox;
		if (!bounds) return;
		partToPrinter.multiplyMatrices(worldToPrinter, part.matrixWorld);
		slot = Math.max(slot, partBounds.copy(bounds).applyMatrix4(partToPrinter).max.z);
	});
	if (!Number.isFinite(slot)) return;
	// Leave a printed strip past the slot, then feed out the rest before lifting the sheet.
	paper.position.z = slot + 0.026 - paperBounds.max.z * paper.scale.z;
	const ejectDistance = slot + 0.008 - (paper.position.z + paperBounds.min.z * paper.scale.z);

	const uv = new THREE.Float32BufferAttribute(new Float32Array(positions.count * 2), 2);
	for (let vertex = 0; vertex < positions.count; vertex++) {
		uv.setXY(
			vertex,
			(positions.getX(vertex) - left) / (right - left),
			(front - positions.getZ(vertex)) / (front - back)
		);
	}
	const geometry = paper.geometry;
	geometry.setAttribute('uv', uv);
	geometry.clearGroups();
	const index = geometry.index;
	const count = index?.count ?? positions.count;
	for (let start = 0; start < count; start += 3) {
		const onTop = [start, start + 1, start + 2].every(
			(entry) => positions.getY(index ? index.getX(entry) : entry) >= topY - 0.0001
		);
		const materialIndex = onTop ? 0 : 1;
		const previousGroup = geometry.groups.at(-1);
		if (previousGroup?.materialIndex === materialIndex) previousGroup.count += 3;
		else geometry.addGroup(start, 3, materialIndex);
	}
	const blankPaper = new THREE.MeshStandardMaterial({
		color: 0xfffdf8,
		roughness: 0.95,
		emissive: 0xfffdf8,
		emissiveIntensity: 0.35
	});
	paper.material = [createPrintMaterial(width / length, anisotropy), blankPaper];
	return {
		presentation: createForegroundPresentation(paper, face(left, right, back, front), foreground, {
			ejectDistance,
			horizontalFill: 0.94,
			verticalFill: 0.86
		})
	};
}
