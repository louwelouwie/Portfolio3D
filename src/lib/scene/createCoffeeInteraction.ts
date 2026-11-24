import * as THREE from 'three';

export function createCoffeeInteraction(
	pivot: THREE.Group,
	fluid: THREE.Object3D,
	reducedMotion: MediaQueryList,
	{ onDrink, onSetDown }: { onDrink: () => void; onSetDown: () => void }
) {
	const restY = pivot.position.y;
	const lowestLevel = fluid.position.y - 0.016;
	const towardCamera = new THREE.Vector3();
	const tiltAxis = new THREE.Vector3();
	const up = new THREE.Vector3(0, 1, 0);
	let started: number | undefined;
	let fromLevel = fluid.position.y;
	let nextLevel = fromLevel;
	let drinking = false;

	return {
		get active() {
			return started !== undefined;
		},
		sip(cameraPosition: THREE.Vector3) {
			if (started !== undefined || !pivot.parent) return false;
			fromLevel = fluid.position.y;
			nextLevel = Math.max(lowestLevel, fromLevel - 0.004);
			if (reducedMotion.matches) {
				fluid.position.y = nextLevel;
				onDrink();
				return true;
			}
			pivot.parent.worldToLocal(towardCamera.copy(cameraPosition)).sub(pivot.position);
			towardCamera.y = 0;
			tiltAxis.crossVectors(up, towardCamera).normalize();
			started = performance.now();
			drinking = false;
			return true;
		},
		update(now: number) {
			if (started === undefined) return;
			const progress = reducedMotion.matches ? 1 : Math.min((now - started) / 1350, 1);
			if (!drinking && progress >= 0.33) {
				drinking = true;
				onDrink();
			}
			const lift =
				THREE.MathUtils.smoothstep(progress, 0, 0.28) *
				(1 - THREE.MathUtils.smoothstep(progress, 0.7, 1));
			pivot.position.y = restY + 0.12 * lift;
			pivot.quaternion.setFromAxisAngle(tiltAxis, 0.45 * lift);
			fluid.position.y = THREE.MathUtils.lerp(
				fromLevel,
				nextLevel,
				THREE.MathUtils.smoothstep(progress, 0.33, 0.65)
			);
			if (progress === 1) {
				started = undefined;
				onSetDown();
			}
		}
	};
}
