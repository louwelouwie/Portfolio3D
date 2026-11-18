import * as THREE from 'three';

type Target = {
	object: THREE.Object3D;
	baseScale: THREE.Vector3;
	delay: number;
	duration: number;
};

/** Give a mesh with baked vertex coordinates a pivot at its bottom center. */
export function withBottomPivot(root: THREE.Object3D, object: THREE.Object3D) {
	const bounds = new THREE.Box3().setFromObject(object);
	const pivot = bounds.getCenter(new THREE.Vector3());
	pivot.y = bounds.min.y;
	root.worldToLocal(pivot);
	const group = new THREE.Group();
	group.name = `${object.name}PopPivot`;
	group.position.copy(pivot);
	root.add(group);
	root.updateWorldMatrix(true, true);
	group.attach(object);
	return group;
}

export function createPopAnimation(reducedMotion: MediaQueryList) {
	const targets: Target[] = [];
	let started = 0;

	return {
		add(object: THREE.Object3D, delay: number, duration: number) {
			targets.push({ object, baseScale: object.scale.clone(), delay, duration });
			if (!reducedMotion.matches) object.scale.multiplyScalar(0.001);
		},
		start() {
			started = performance.now();
		},
		update(object: THREE.Object3D, now: number) {
			const target = targets.find((item) => item.object === object);
			if (!target) return 1;
			const progress = reducedMotion.matches
				? 1
				: THREE.MathUtils.clamp((now - started - target.delay) / target.duration, 0, 1);
			const back = 1.2;
			const eased =
				progress === 1 ? 1 : 1 + (back + 1) * (progress - 1) ** 3 + back * (progress - 1) ** 2;
			const scale = Math.max(0.001, eased);
			object.scale.copy(target.baseScale).multiplyScalar(scale);
			return scale;
		},
		get finished() {
			return (
				reducedMotion.matches ||
				(started > 0 &&
					targets.every((target) => performance.now() - started >= target.delay + target.duration))
			);
		}
	};
}
