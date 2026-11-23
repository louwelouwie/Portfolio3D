import * as THREE from 'three';

export type SurfaceCorners = readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];

export function createForegroundPresentation(
	mesh: THREE.Mesh,
	[topLeft, topRight, bottomRight, bottomLeft]: SurfaceCorners,
	foreground: THREE.Group,
	{ ejectDistance = 0, horizontalFill = 0.82, verticalFill = 0.55 } = {}
) {
	const holder = mesh.parent;
	if (!holder) throw new Error('The foreground mesh needs a holder');
	const localPosition = mesh.position.clone();
	const localRotation = mesh.quaternion.clone();
	const localScale = mesh.scale.clone();
	const material = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
	const depthTests = material.map((entry) => entry.depthTest);
	const renderOrder = mesh.renderOrder;
	const center = topLeft.clone().lerp(bottomRight, 0.5);
	const faceRight = topRight.clone().sub(topLeft);
	const faceUp = topLeft.clone().sub(bottomLeft);
	const faceNormal = new THREE.Vector3().crossVectors(faceRight, faceUp).normalize();
	const faceCorrection = new THREE.Quaternion()
		.setFromRotationMatrix(
			new THREE.Matrix4().makeBasis(
				faceRight.clone().normalize(),
				new THREE.Vector3().crossVectors(faceNormal, faceRight).normalize(),
				faceNormal
			)
		)
		.invert();
	const holderPosition = new THREE.Vector3();
	const restPosition = new THREE.Vector3();
	const restRotation = new THREE.Quaternion();
	const restScale = new THREE.Vector3();
	const targetPosition = new THREE.Vector3();
	const targetRotation = new THREE.Quaternion();
	const targetScale = new THREE.Vector3();
	const direction = new THREE.Vector3();
	const faceOffset = new THREE.Vector3();
	const edge = new THREE.Vector3();
	const ejectEnd = ejectDistance ? 0.36 : 0;

	return {
		update(progress: number, camera: THREE.PerspectiveCamera, rotation: THREE.Quaternion) {
			holderPosition.copy(localPosition);
			if (ejectEnd)
				holderPosition.z += ejectDistance * THREE.MathUtils.smoothstep(progress, 0, ejectEnd);
			const travel = THREE.MathUtils.smoothstep(progress, ejectEnd, 1);
			if (!travel) {
				if (mesh.parent !== holder) {
					holder.add(mesh);
					mesh.renderOrder = renderOrder;
					material.forEach((entry, index) => (entry.depthTest = depthTests[index]));
				}
				mesh.position.copy(holderPosition);
				mesh.quaternion.copy(localRotation);
				mesh.scale.copy(localScale);
				return;
			}
			if (mesh.parent !== foreground) {
				foreground.add(mesh);
				mesh.renderOrder = 100;
				material.forEach((entry) => (entry.depthTest = false));
			}
			holder.localToWorld(restPosition.copy(holderPosition));
			holder.getWorldQuaternion(restRotation).multiply(localRotation);
			holder.getWorldScale(restScale).multiply(localScale);
			camera.getWorldDirection(direction);
			camera.getWorldPosition(targetPosition).addScaledVector(direction, 0.25);
			camera.getWorldQuaternion(targetRotation).multiply(rotation).multiply(faceCorrection);
			const viewHeight = 0.5 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
			const width = edge.copy(faceRight).multiply(restScale).length();
			const height = edge.copy(faceUp).multiply(restScale).length();
			const scale = Math.min(
				(horizontalFill * viewHeight * camera.aspect) / width,
				(verticalFill * viewHeight) / height
			);
			targetScale.copy(restScale).multiplyScalar(scale);
			targetPosition.sub(
				faceOffset.copy(center).multiply(targetScale).applyQuaternion(targetRotation)
			);
			mesh.position.copy(restPosition).lerp(targetPosition, travel);
			mesh.quaternion.copy(restRotation).slerp(targetRotation, travel);
			mesh.scale.copy(restScale).lerp(targetScale, travel);
		}
	};
}
