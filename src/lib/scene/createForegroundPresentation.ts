import * as THREE from 'three';

export type SurfaceCorners = readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
type PresentationView = { zoom: number; pan: THREE.Vector2 };

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
	const cameraRotation = new THREE.Quaternion();
	const targetScale = new THREE.Vector3();
	const direction = new THREE.Vector3();
	const faceOffset = new THREE.Vector3();
	const edge = new THREE.Vector3();
	const viewOffset = new THREE.Vector3();
	const ejectEnd = ejectDistance ? 0.36 : 0;

	return {
		update(
			progress: number,
			camera: THREE.PerspectiveCamera,
			rotation: THREE.Quaternion,
			view?: PresentationView
		) {
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
			camera.getWorldQuaternion(cameraRotation);
			targetRotation.copy(cameraRotation).multiply(rotation).multiply(faceCorrection);
			const viewHeight = 0.5 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
			const viewWidth = viewHeight * camera.aspect;
			const width = edge.copy(faceRight).multiply(restScale).length();
			const height = edge.copy(faceUp).multiply(restScale).length();
			const scale = Math.min(
				(horizontalFill * viewWidth) / width,
				(verticalFill * viewHeight) / height
			);
			const zoom = view ? THREE.MathUtils.lerp(1, view.zoom, travel) : 1;
			targetScale.copy(restScale).multiplyScalar(scale * zoom);
			if (view) {
				const maxX = Math.max(0, (width * scale * zoom) / viewWidth - 0.92) / 2;
				const maxY = Math.max(0, (height * scale * zoom) / viewHeight - 0.88) / 2;
				view.pan.x = zoom > 1 ? THREE.MathUtils.clamp(view.pan.x, -maxX, maxX) : 0;
				view.pan.y = zoom > 1 ? THREE.MathUtils.clamp(view.pan.y, -maxY, maxY) : 0;
				viewOffset.set(view.pan.x * viewWidth, -view.pan.y * viewHeight, 0);
				targetPosition.add(viewOffset.applyQuaternion(cameraRotation));
			}
			targetPosition.sub(
				faceOffset.copy(center).multiply(targetScale).applyQuaternion(targetRotation)
			);
			mesh.position.copy(restPosition).lerp(targetPosition, travel);
			mesh.quaternion.copy(restRotation).slerp(targetRotation, travel);
			mesh.scale.copy(restScale).lerp(targetScale, travel);
		}
	};
}
