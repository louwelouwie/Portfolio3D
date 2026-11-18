import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { asset, resolve } from '$app/paths';
import type { ScreenQuad } from './projectIframeToQuad.js';
import { createLampSound } from './createLampSound.js';
import { createPopAnimation, withBottomPivot } from './createPopAnimation.js';
import { LAPTOP_SCREEN } from './deviceScreens.js';

export type PortfolioScene = {
	enterFocus: () => void;
	getScreenQuad: () => ScreenQuad | null;
	setDarkMode: (value: boolean) => void;
	setSoundEnabled: (value: boolean) => void;
	exitFocus: () => void;
	dispose: () => void;
};

export type HoverTarget = 'laptop' | 'lamp' | null;

type SceneEvents = {
	onError: () => void;
	onFrame: () => void;
	onHoverChange: (target: HoverTarget) => void;
	onFocusChange: (focused: boolean) => void;
	onThemeChange: (darkMode: boolean) => void;
	initialDarkMode: boolean;
	initialSoundEnabled: boolean;
};

const CAMERA = {
	overviewDistance: 1.08,
	focusDistance: 0.18,
	overviewHeight: 0.33,
	focusHeight: 0.045,
	phoneOverviewHeight: 0.43,
	phoneFocusHeight: 0.1,
	phoneFocusAspect: 1.35,
	desktopFocusAspect: 1.45,
	focusDuration: 1000,
	yawLimit: 0.38,
	pitchLimit: 0.18,
	rotationLerp: 0.08,
	lift: 0.015
} as const;

function disposeModel(model: THREE.Object3D) {
	const geometries = new Set<THREE.BufferGeometry>();
	const materials = new Set<THREE.Material>();
	const textures = new Set<THREE.Texture>();
	model.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		geometries.add(object.geometry);
		for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
			materials.add(material);
			for (const value of Object.values(material)) {
				if (value instanceof THREE.Texture) textures.add(value);
			}
		}
	});
	for (const geometry of geometries) geometry.dispose();
	for (const material of materials) material.dispose();
	for (const texture of textures) texture.dispose();
}

export function createPortfolioScene(
	container: HTMLDivElement,
	canvas: HTMLCanvasElement,
	tooltip: HTMLDivElement,
	{
		onError,
		onFrame,
		onHoverChange,
		onFocusChange,
		onThemeChange,
		initialDarkMode,
		initialSoundEnabled
	}: SceneEvents
): PortfolioScene {
	const scene = new THREE.Scene();
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const pop = createPopAnimation(reducedMotion);
	const lampSound = createLampSound();
	const darkBackground = new THREE.Color(0x14233a);
	const lightBackground = new THREE.Color(0xe7f0ff);
	const background = (initialDarkMode ? darkBackground : lightBackground).clone();
	scene.background = background;
	const cssScene = new THREE.Scene();
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.shadowMap.enabled = true;
	const cssRenderer = new CSS3DRenderer();
	cssRenderer.domElement.style.position = 'absolute';
	cssRenderer.domElement.style.inset = '0';
	cssRenderer.domElement.style.pointerEvents = 'none';
	container.appendChild(cssRenderer.domElement);

	const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 10);
	const yaw = new THREE.Object3D();
	const pitch = new THREE.Object3D();
	yaw.add(pitch);
	pitch.add(camera);
	scene.add(yaw);
	const ambientLight = new THREE.HemisphereLight(0xdce7ff, 0x35394a, initialDarkMode ? 0.6 : 0.85);
	scene.add(ambientLight);
	const keyLight = new THREE.DirectionalLight(0xf1f5ff, initialDarkMode ? 0.65 : 0.35);
	keyLight.position.set(3, 10, 10);
	scene.add(keyLight);
	const daylight = new THREE.DirectionalLight(0xfff6e8, initialDarkMode ? 0 : 1.5);
	daylight.castShadow = true;
	daylight.shadow.mapSize.set(2048, 2048);
	daylight.shadow.camera.left = -1;
	daylight.shadow.camera.right = 1;
	daylight.shadow.camera.top = 1;
	daylight.shadow.camera.bottom = -1;
	daylight.shadow.camera.near = 0.1;
	daylight.shadow.camera.far = 5;
	daylight.shadow.bias = -0.0001;
	// Keep the model's broad surfaces from sampling their own shadow map depth.
	daylight.shadow.normalBias = 0.005;
	daylight.target.position.set(0, -0.05, 0);
	scene.add(daylight, daylight.target);
	const lampLight = new THREE.SpotLight(0xffc77f, initialDarkMode ? 1.2 : 0, 0.8, 0.95, 0.8);
	lampLight.castShadow = true;
	lampLight.shadow.mapSize.set(1024, 1024);
	lampLight.shadow.bias = -0.0001;
	lampLight.shadow.normalBias = 0.005;
	scene.add(lampLight, lampLight.target);
	const iframe = document.createElement('iframe');
	iframe.src = `${resolve('/desktop')}?closed=1&embedded=1`;
	iframe.title = 'Chris Louwerse portfolio on laptop screen';
	iframe.style.width = `${LAPTOP_SCREEN.width}px`;
	iframe.style.height = `${LAPTOP_SCREEN.height}px`;
	iframe.style.border = '0';
	iframe.style.borderRadius = '4px';
	const screenObject = new CSS3DObject(iframe);
	screenObject.visible = false;
	// CSS3DObject enables pointer events in its constructor. The overview screen is a preview;
	// a native overlay aligns with the screen after focus so its controls work reliably.
	iframe.style.pointerEvents = 'none';
	iframe.tabIndex = -1;
	cssScene.add(screenObject);

	let focused = false;
	let focusRequested = false;
	let hovered: HoverTarget = null;
	let tooltipAnchor: HoverTarget = null;
	let lampExitUntil = 0;
	let hoverTimer: ReturnType<typeof setTimeout> | undefined;
	let hoverX = 0;
	let hoverY = 0;
	let darkMode = initialDarkMode;
	let soundEnabled = initialSoundEnabled;
	let dragging = false;
	let dragged = false;
	let activePointer: number | undefined;
	let startX = 0;
	let startY = 0;
	let lastX = 0;
	let lastY = 0;
	let targetYaw = 0;
	let targetPitch = 0;
	let lift = 0;
	let laptopStartY = 0;
	let laptopTopY = 0;
	let cameraDistance: number = CAMERA.overviewDistance;
	let focusAmount = 0;
	let focusFrom = 0;
	let focusStarted = 0;
	let screenSurfaceWidth = 0;
	let screenSurfaceHeight = 0;
	let laptop: THREE.Object3D | undefined;
	let desk: THREE.Object3D | undefined;
	let deskPlate: THREE.Object3D | undefined;
	let deskPopGroup: THREE.Group | undefined;
	let lamp: THREE.Object3D | undefined;
	let laptopPopGroup: THREE.Group | undefined;
	let lampPopGroup: THREE.Group | undefined;
	const propPopGroups: THREE.Group[] = [];
	let screenMesh: THREE.Mesh | undefined;
	let lampBulbMaterial: THREE.MeshStandardMaterial | undefined;
	let disposed = false;
	let frameId = 0;
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	const screenPosition = new THREE.Vector3();
	const localScreenCenter = new THREE.Vector3();
	const localScreenCorners = [0, 1, 2, 3].map(() => new THREE.Vector3());
	const projectedScreenCorners = [0, 1, 2, 3].map(() => new THREE.Vector3());
	const screenOffset = new THREE.Vector3();
	const tooltipPosition = new THREE.Vector3();
	const lampAnchor = new THREE.Vector3();
	const screenPlane = new THREE.Plane();
	const screenIntersection = new THREE.Vector3();
	const screenLocal = new THREE.Vector3();
	const screenNormal = new THREE.Vector3();
	const inverseScreenRotation = new THREE.Quaternion();
	const cameraWorld = new THREE.Vector3();

	const isWithin = (object: THREE.Object3D, parent: THREE.Object3D) => {
		for (let current: THREE.Object3D | null = object; current; current = current.parent) {
			if (current === parent) return true;
		}
		return false;
	};
	const hitTarget = (clientX: number, clientY: number): HoverTarget => {
		if (!laptop || !desk || !pop.finished) return null;
		const rect = canvas.getBoundingClientRect();
		pointer.set(
			((clientX - rect.left) / rect.width) * 2 - 1,
			-((clientY - rect.top) / rect.height) * 2 + 1
		);
		camera.updateWorldMatrix(true, false);
		raycaster.setFromCamera(pointer, camera);
		const hit = raycaster.intersectObjects([laptop, desk], true)[0];
		if (hit && lamp && isWithin(hit.object, lamp)) return 'lamp';
		if (hit && isWithin(hit.object, laptop)) return 'laptop';
		if (!screenSurfaceWidth) return null;
		screenNormal.set(0, 0, 1).applyQuaternion(screenObject.quaternion);
		screenPlane.setFromNormalAndCoplanarPoint(screenNormal, screenObject.position);
		if (!raycaster.ray.intersectPlane(screenPlane, screenIntersection)) return null;
		if (hit && hit.distance < raycaster.ray.origin.distanceTo(screenIntersection)) return null;
		inverseScreenRotation.copy(screenObject.quaternion).invert();
		screenLocal
			.copy(screenIntersection)
			.sub(screenObject.position)
			.applyQuaternion(inverseScreenRotation);
		return Math.abs(screenLocal.x) <= screenSurfaceWidth / 2 &&
			Math.abs(screenLocal.y) <= screenSurfaceHeight / 2
			? 'laptop'
			: null;
	};
	const setHovered = (next: HoverTarget) => {
		canvas.style.cursor = next ? 'pointer' : dragging ? 'grabbing' : 'grab';
		if (hovered === next) return;
		hovered = next;
		if (next) tooltipAnchor = next;
		onHoverChange(next);
	};
	const updateHover = (next: HoverTarget, clientX: number, clientY: number) => {
		hoverX = clientX;
		hoverY = clientY;
		if (next === 'lamp') {
			clearTimeout(hoverTimer);
			hoverTimer = undefined;
			lampExitUntil = 0;
			setHovered('lamp');
			return;
		}
		if (hovered === 'lamp') {
			lampExitUntil = performance.now() + 320;
			setHovered(null);
		}
		if (next === 'laptop' && performance.now() < lampExitUntil) {
			if (!hoverTimer) {
				hoverTimer = setTimeout(() => {
					hoverTimer = undefined;
					if (!focused && !dragging && hitTarget(hoverX, hoverY) === 'laptop') setHovered('laptop');
				}, lampExitUntil - performance.now());
			}
			return;
		}
		if (next !== 'laptop') {
			clearTimeout(hoverTimer);
			hoverTimer = undefined;
		}
		setHovered(next);
	};
	const setDarkMode = (next: boolean) => {
		if (darkMode === next) return;
		darkMode = next;
		onThemeChange(next);
	};
	const setFocused = (next: boolean) => {
		if (focused === next) return;
		clearTimeout(hoverTimer);
		hoverTimer = undefined;
		focused = next;
		focusFrom = focusAmount;
		focusStarted = performance.now();
		setHovered(null);
		canvas.style.cursor = next ? 'default' : 'grab';
		onFocusChange(next);
	};
	const onPointerDown = (event: PointerEvent) => {
		if (focused || event.button !== 0) return;
		clearTimeout(hoverTimer);
		hoverTimer = undefined;
		dragging = true;
		dragged = false;
		activePointer = event.pointerId;
		startX = lastX = event.clientX;
		startY = lastY = event.clientY;
		canvas.setPointerCapture(event.pointerId);
		canvas.style.cursor = 'grabbing';
	};
	const onPointerMove = (event: PointerEvent) => {
		if (focused) return;
		if (dragging && activePointer === event.pointerId) {
			if (Math.hypot(event.clientX - startX, event.clientY - startY) > 5) dragged = true;
			if (dragged) {
				targetYaw = THREE.MathUtils.clamp(
					targetYaw - (event.clientX - lastX) * 0.003,
					-CAMERA.yawLimit,
					CAMERA.yawLimit
				);
				targetPitch = THREE.MathUtils.clamp(
					targetPitch - (event.clientY - lastY) * 0.0025,
					-CAMERA.pitchLimit,
					CAMERA.pitchLimit
				);
				setHovered(null);
			}
			lastX = event.clientX;
			lastY = event.clientY;
			return;
		}
		updateHover(hitTarget(event.clientX, event.clientY), event.clientX, event.clientY);
	};
	const onPointerUp = (event: PointerEvent) => {
		if (!dragging || activePointer !== event.pointerId) return;
		dragging = false;
		activePointer = undefined;
		canvas.releasePointerCapture(event.pointerId);
		const target = hitTarget(event.clientX, event.clientY);
		if (!dragged && target === 'laptop') setFocused(true);
		else if (!dragged && target === 'lamp') {
			if (soundEnabled) lampSound.play(!darkMode);
			setDarkMode(!darkMode);
		}
		if (!focused) updateHover(target, event.clientX, event.clientY);
	};
	const onPointerCancel = () => {
		dragging = false;
		activePointer = undefined;
		clearTimeout(hoverTimer);
		hoverTimer = undefined;
		setHovered(null);
	};
	const onPointerLeave = () => {
		if (!dragging) {
			clearTimeout(hoverTimer);
			hoverTimer = undefined;
			setHovered(null);
		}
	};
	const onResize = () => {
		const { clientWidth: width, clientHeight: height } = container;
		if (!width || !height) return;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height);
		cssRenderer.setSize(width, height);
	};
	canvas.style.cursor = 'grab';
	canvas.addEventListener('pointerdown', onPointerDown);
	canvas.addEventListener('pointermove', onPointerMove);
	canvas.addEventListener('pointerup', onPointerUp);
	canvas.addEventListener('pointercancel', onPointerCancel);
	canvas.addEventListener('pointerleave', onPointerLeave);
	const resizeObserver = new ResizeObserver(onResize);
	resizeObserver.observe(container);
	onResize();

	const loader = new GLTFLoader();
	void loader
		.loadAsync(asset('models/desk-setup.glb'))
		.then(({ scene: model }) => {
			if (disposed) {
				disposeModel(model);
				return;
			}
			const laptopCandidate = model.getObjectByName('Laptop_Base');
			const screenCandidate = model.getObjectByName('Laptop_Screen');
			const deskCandidate = model.getObjectByName('Desk');
			const lampCandidate = model.getObjectByName('Lamp_Base');
			const bulbCandidate = model.getObjectByName('Lamp_Bulb');
			if (
				!laptopCandidate ||
				!(screenCandidate instanceof THREE.Mesh) ||
				!deskCandidate ||
				!lampCandidate ||
				!(bulbCandidate instanceof THREE.Mesh)
			) {
				console.error('Desk model needs Laptop_Base, Laptop_Screen, Desk, Lamp_Base and Lamp_Bulb');
				disposeModel(model);
				onError();
				return;
			}
			desk = model;
			laptop = laptopCandidate;
			screenMesh = screenCandidate;
			deskPlate = deskCandidate;
			lamp = lampCandidate;
			scene.add(desk);
			laptopTopY = new THREE.Box3().setFromObject(laptop).max.y;
			const plateBounds = new THREE.Box3().setFromObject(deskPlate);
			const lampBounds = new THREE.Box3().setFromObject(lamp);
			const bulbBounds = new THREE.Box3().setFromObject(bulbCandidate);
			desk.traverse((object) => {
				if (!(object instanceof THREE.Mesh)) return;
				object.castShadow = object !== deskPlate && !isWithin(object, lampCandidate);
				object.receiveShadow = true;
			});
			lampBulbMaterial = new THREE.MeshStandardMaterial({
				color: 0xffead3,
				roughness: 0.35,
				emissive: 0xffc77f,
				emissiveIntensity: darkMode ? 1.6 : 0
			});
			bulbCandidate.material = lampBulbMaterial;
			lampBounds.getCenter(lampAnchor);
			lampAnchor.y = lampBounds.max.y + 0.05;
			bulbBounds.getCenter(lampLight.position);
			lampLight.position.y = bulbBounds.min.y - 0.005;
			lampLight.target.position.set(
				lampLight.position.x - 0.12,
				plateBounds.max.y,
				lampLight.position.z + 0.09
			);
			screenMesh.geometry.computeBoundingBox();
			const localBounds = screenMesh.geometry.boundingBox!;
			const positions = screenMesh.geometry.getAttribute('position');
			let topZ = 0;
			let bottomZ = 0;
			for (let index = 0; index < positions.count; index++) {
				if (Math.abs(positions.getY(index) - localBounds.max.y) < 0.00001)
					topZ = positions.getZ(index);
				if (Math.abs(positions.getY(index) - localBounds.min.y) < 0.00001)
					bottomZ = positions.getZ(index);
			}
			localScreenCenter.set(
				(localBounds.min.x + localBounds.max.x) / 2,
				(localBounds.min.y + localBounds.max.y) / 2,
				(topZ + bottomZ) / 2
			);
			localScreenCorners[0].set(localBounds.min.x, localBounds.max.y, topZ);
			localScreenCorners[1].set(localBounds.max.x, localBounds.max.y, topZ);
			localScreenCorners[2].set(localBounds.max.x, localBounds.min.y, bottomZ);
			localScreenCorners[3].set(localBounds.min.x, localBounds.min.y, bottomZ);
			screenSurfaceWidth = localBounds.max.x - localBounds.min.x;
			screenSurfaceHeight = Math.hypot(localBounds.max.y - localBounds.min.y, topZ - bottomZ);
			screenObject.scale.set(
				screenSurfaceWidth / LAPTOP_SCREEN.width,
				screenSurfaceHeight / LAPTOP_SCREEN.height,
				1
			);
			screenMesh.localToWorld(screenPosition.copy(localScreenCenter));
			screenObject.position.copy(screenPosition);
			const orientation = screenMesh.getWorldQuaternion(new THREE.Quaternion());
			const tilt = new THREE.Quaternion().setFromAxisAngle(
				new THREE.Vector3(1, 0, 0),
				Math.atan2(topZ - bottomZ, localBounds.max.y - localBounds.min.y)
			);
			screenObject.quaternion.copy(orientation).multiply(tilt);
			screenOffset.set(0, 0, 1).applyQuaternion(screenObject.quaternion).multiplyScalar(0.0001);
			screenObject.position.add(screenOffset);
			yaw.position.copy(screenPosition);
			screenObject.visible = true;
			const props = [...desk.children].filter((object) => object !== deskPlate);
			deskPopGroup = withBottomPivot(desk, deskPlate);
			pop.add(deskPopGroup, 0, 580);
			for (const [index, object] of props.entries()) {
				const group = withBottomPivot(desk, object);
				propPopGroups.push(group);
				if (object === laptop) laptopPopGroup = group;
				if (object === lamp) lampPopGroup = group;
				pop.add(group, 250 + index * 30, 500);
			}
			laptopStartY = laptop.position.y;
			pop.start();
		})
		.catch((error: unknown) => {
			if (!disposed) {
				console.error('Could not load the desk model', error);
				onError();
			}
		});

	const render = () => {
		if (disposed) return;
		frameId = requestAnimationFrame(render);
		const transition = 0.09;
		const now = performance.now();
		if (deskPopGroup) pop.update(deskPopGroup, now);
		let laptopPop = 1;
		let lampPop = 1;
		for (const group of propPopGroups) {
			const scale = pop.update(group, now);
			if (group === laptopPopGroup) laptopPop = scale;
			if (group === lampPopGroup) lampPop = scale;
		}
		if (focusRequested && screenMesh && pop.finished) {
			focusRequested = false;
			setFocused(true);
		}
		background.lerp(darkMode ? darkBackground : lightBackground, transition);
		ambientLight.intensity = THREE.MathUtils.lerp(
			ambientLight.intensity,
			darkMode ? 0.6 : 0.85,
			transition
		);
		keyLight.intensity = THREE.MathUtils.lerp(
			keyLight.intensity,
			darkMode ? 0.65 : 0.35,
			transition
		);
		daylight.intensity = THREE.MathUtils.lerp(daylight.intensity, darkMode ? 0 : 1.5, transition);
		lampLight.intensity = THREE.MathUtils.lerp(
			lampLight.intensity,
			darkMode ? 1.2 * Math.min(lampPop, 1) : 0,
			transition
		);
		if (lampBulbMaterial)
			lampBulbMaterial.emissiveIntensity = THREE.MathUtils.lerp(
				lampBulbMaterial.emissiveIntensity,
				darkMode ? 1.6 : 0,
				transition
			);
		if (laptop && screenMesh) {
			screenObject.scale.set(
				(screenSurfaceWidth / LAPTOP_SCREEN.width) * laptopPop,
				(screenSurfaceHeight / LAPTOP_SCREEN.height) * laptopPop,
				1
			);
			const elapsed = reducedMotion.matches
				? 1
				: THREE.MathUtils.clamp((performance.now() - focusStarted) / CAMERA.focusDuration, 0, 1);
			const eased = elapsed * elapsed * (3 - 2 * elapsed);
			focusAmount = THREE.MathUtils.lerp(focusFrom, focused ? 1 : 0, eased);
			lift = THREE.MathUtils.lerp(lift, hovered === 'laptop' || focused ? CAMERA.lift : 0, 0.08);
			laptop.position.y = laptopStartY + lift;
			screenMesh.localToWorld(screenPosition.copy(localScreenCenter));
			screenObject.position.copy(screenPosition).add(screenOffset);
			yaw.position.lerp(screenPosition, 0.1);
			const phone = container.clientWidth < 640;
			const focusDistance = Math.max(
				CAMERA.focusDistance,
				(CAMERA.focusDistance *
					(phone ? CAMERA.phoneFocusAspect : CAMERA.desktopFocusAspect) *
					container.clientHeight) /
					container.clientWidth
			);
			cameraDistance = THREE.MathUtils.lerp(CAMERA.overviewDistance, focusDistance, focusAmount);
			yaw.rotation.y = THREE.MathUtils.lerp(
				yaw.rotation.y,
				targetYaw * (1 - focusAmount),
				CAMERA.rotationLerp
			);
			pitch.rotation.x = THREE.MathUtils.lerp(
				pitch.rotation.x,
				targetPitch * (1 - focusAmount),
				CAMERA.rotationLerp
			);
			camera.position.y = THREE.MathUtils.lerp(
				phone ? CAMERA.phoneOverviewHeight : CAMERA.overviewHeight,
				phone ? CAMERA.phoneFocusHeight : CAMERA.focusHeight,
				focusAmount
			);
			camera.position.z = cameraDistance;
			camera.lookAt(screenPosition);
			camera.updateWorldMatrix(true, false);
			camera.getWorldPosition(cameraWorld);
			daylight.position.set(cameraWorld.x - 0.25, cameraWorld.y + 0.7, cameraWorld.z + 0.4);
			if (tooltipAnchor === 'lamp') tooltipPosition.copy(lampAnchor);
			else tooltipPosition.set(screenPosition.x, laptopTopY + lift + 0.06, screenPosition.z);
			tooltipPosition.project(camera);
			tooltip.style.left = `${(tooltipPosition.x * 0.5 + 0.5) * container.clientWidth}px`;
			tooltip.style.top = `${(-tooltipPosition.y * 0.5 + 0.5) * container.clientHeight}px`;
		} else {
			camera.position.z = cameraDistance;
			camera.lookAt(0, 0, 0);
		}
		renderer.render(scene, camera);
		cssRenderer.render(cssScene, camera);
		onFrame();
	};
	render();

	return {
		enterFocus: () => {
			if (screenMesh && pop.finished) setFocused(true);
			else focusRequested = true;
		},
		getScreenQuad: () => {
			const mesh = screenMesh;
			if (!mesh || !screenObject.visible) return null;
			camera.updateWorldMatrix(true, false);
			const rect = canvas.getBoundingClientRect();
			const projectCorner = (corner: THREE.Vector3, point: THREE.Vector3) => {
				mesh.localToWorld(point.copy(corner));
				point.project(camera);
				return {
					x: rect.left + (point.x * 0.5 + 0.5) * rect.width,
					y: rect.top + (-point.y * 0.5 + 0.5) * rect.height
				};
			};
			return [
				projectCorner(localScreenCorners[0], projectedScreenCorners[0]),
				projectCorner(localScreenCorners[1], projectedScreenCorners[1]),
				projectCorner(localScreenCorners[2], projectedScreenCorners[2]),
				projectCorner(localScreenCorners[3], projectedScreenCorners[3])
			];
		},
		setDarkMode,
		setSoundEnabled: (value) => (soundEnabled = value),
		exitFocus: () => {
			focusRequested = false;
			setFocused(false);
		},
		dispose: () => {
			if (disposed) return;
			disposed = true;
			cancelAnimationFrame(frameId);
			clearTimeout(hoverTimer);
			resizeObserver.disconnect();
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerup', onPointerUp);
			canvas.removeEventListener('pointercancel', onPointerCancel);
			canvas.removeEventListener('pointerleave', onPointerLeave);
			cssRenderer.domElement.remove();
			if (desk) disposeModel(desk);
			lampSound.dispose();
			lampLight.shadow.dispose();
			daylight.shadow.dispose();
			renderer.dispose();
		}
	};
}
