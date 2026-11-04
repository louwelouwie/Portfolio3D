import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';
import { asset, resolve } from '$app/paths';

export type PortfolioScene = {
	enterFocus: () => void;
	getScreenRect: () => { left: number; top: number; width: number; height: number };
	setDarkMode: (value: boolean) => void;
	exitFocus: () => void;
	dispose: () => void;
};

export type HoverTarget = 'laptop' | 'lamp' | null;

type SceneEvents = {
	onError: () => void;
	onHoverChange: (target: HoverTarget) => void;
	onFocusChange: (focused: boolean) => void;
	onThemeChange: (darkMode: boolean) => void;
	initialDarkMode: boolean;
};

const SCREEN = { width: 1280, height: 800, fitHeight: 780 };
const CAMERA = {
	overviewDistance: 1.15,
	focusDistance: 0.2,
	overviewHeight: 0.34,
	focusHeight: 0.05,
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
	{ onError, onHoverChange, onFocusChange, onThemeChange, initialDarkMode }: SceneEvents
): PortfolioScene {
	const scene = new THREE.Scene();
	const darkBackground = new THREE.Color(0x1b202b);
	const lightBackground = new THREE.Color(0xe8ecf1);
	const darkDesk = new THREE.Color(0x68717f);
	const lightDesk = new THREE.Color(0xb3b9c2);
	const darkShade = new THREE.Color(0x34475d);
	const lightShade = new THREE.Color(0x62788e);
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
	const ambientLight = new THREE.HemisphereLight(0xdce7ff, 0x35394a, initialDarkMode ? 0.6 : 1.6);
	scene.add(ambientLight);
	const keyLight = new THREE.DirectionalLight(0xf1f5ff, initialDarkMode ? 0.65 : 1.5);
	keyLight.position.set(3, 10, 10);
	scene.add(keyLight);
	const lampLight = new THREE.SpotLight(0xffc77f, initialDarkMode ? 0.08 : 0, 0.8, 0.95, 0.8);
	lampLight.castShadow = true;
	lampLight.shadow.mapSize.set(1024, 1024);
	lampLight.shadow.bias = -0.0001;
	scene.add(lampLight, lampLight.target);
	const bulbMaterial = new THREE.MeshBasicMaterial({
		color: 0xffd69b,
		transparent: true,
		opacity: initialDarkMode ? 1 : 0
	});
	const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), bulbMaterial);
	bulb.visible = initialDarkMode;
	scene.add(bulb);

	const iframe = document.createElement('iframe');
	iframe.src = `${resolve('/desktop')}?closed=1&embedded=1`;
	iframe.title = 'Chris Louwerse portfolio on laptop screen';
	iframe.style.width = `${SCREEN.width}px`;
	iframe.style.height = `${SCREEN.height}px`;
	iframe.style.border = '0';
	iframe.style.borderRadius = '4px';
	const screenObject = new CSS3DObject(iframe);
	// CSS3DObject enables pointer events in its constructor. The overview screen is a preview;
	// the full-size HTML view takes over after the camera zoom so its controls work reliably.
	iframe.style.pointerEvents = 'none';
	iframe.tabIndex = -1;
	cssScene.add(screenObject);

	let focused = false;
	let hovered: HoverTarget = null;
	let darkMode = initialDarkMode;
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
	let lamp: THREE.Object3D | undefined;
	let screenMesh: THREE.Object3D | undefined;
	let deskSurfaceMaterial: THREE.MeshStandardMaterial | undefined;
	let lampShadeMaterial: THREE.MeshStandardMaterial | undefined;
	let disposed = false;
	let frameId = 0;
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	const screenPosition = new THREE.Vector3();
	const screenOffset = new THREE.Vector3();
	const tooltipPosition = new THREE.Vector3();
	const lampAnchor = new THREE.Vector3();
	const screenPlane = new THREE.Plane();
	const screenIntersection = new THREE.Vector3();
	const screenLocal = new THREE.Vector3();
	const screenNormal = new THREE.Vector3();
	const inverseScreenRotation = new THREE.Quaternion();

	const isWithin = (object: THREE.Object3D, parent: THREE.Object3D) => {
		for (let current: THREE.Object3D | null = object; current; current = current.parent) {
			if (current === parent) return true;
		}
		return false;
	};
	const hitTarget = (clientX: number, clientY: number): HoverTarget => {
		if (!laptop || !desk) return null;
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
		onHoverChange(next);
	};
	const setDarkMode = (next: boolean) => {
		if (darkMode === next) return;
		darkMode = next;
		onThemeChange(next);
	};
	const setFocused = (next: boolean) => {
		if (focused === next) return;
		focused = next;
		focusFrom = focusAmount;
		focusStarted = performance.now();
		setHovered(null);
		canvas.style.cursor = next ? 'default' : 'grab';
		onFocusChange(next);
	};
	const onPointerDown = (event: PointerEvent) => {
		if (focused || event.button !== 0) return;
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
		setHovered(hitTarget(event.clientX, event.clientY));
	};
	const onPointerUp = (event: PointerEvent) => {
		if (!dragging || activePointer !== event.pointerId) return;
		dragging = false;
		activePointer = undefined;
		canvas.releasePointerCapture(event.pointerId);
		const target = hitTarget(event.clientX, event.clientY);
		if (!dragged && target === 'laptop') setFocused(true);
		else if (!dragged && target === 'lamp') setDarkMode(!darkMode);
		if (!focused) setHovered(target);
	};
	const onPointerCancel = () => {
		dragging = false;
		activePointer = undefined;
		setHovered(null);
	};
	const onPointerLeave = () => {
		if (!dragging) setHovered(null);
	};
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') setFocused(false);
	};
	const onIframeLoad = () => iframe.contentWindow?.addEventListener('keydown', onKeyDown);
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
	window.addEventListener('keydown', onKeyDown);
	iframe.addEventListener('load', onIframeLoad);
	const resizeObserver = new ResizeObserver(onResize);
	resizeObserver.observe(container);
	onResize();

	const loader = new GLTFLoader();
	void Promise.allSettled([
		loader.loadAsync(asset('models/laptop3.glb')),
		loader.loadAsync(asset('models/desk.glb'))
	]).then(([laptopResult, deskResult]) => {
		if (laptopResult.status === 'fulfilled' && deskResult.status === 'fulfilled' && !disposed) {
			laptop = laptopResult.value.scene;
			desk = deskResult.value.scene;
			screenMesh = laptop.getObjectByName('Laptop_Screen');
			if (!screenMesh) {
				console.error('Laptop model has no Laptop_Screen object');
				disposeModel(laptop);
				disposeModel(desk);
				laptop = undefined;
				desk = undefined;
				screenObject.visible = false;
				onError();
				return;
			}
			scene.add(laptop, desk);
			laptopStartY = laptop.position.y;
			laptopTopY = new THREE.Box3().setFromObject(laptop).max.y;
			const basePanel = laptop.getObjectByName('Laptop_BasePanel');
			const deskPlate = desk.getObjectByName('DeskPlate');
			lamp = desk.getObjectByName('Lamp');
			if (!basePanel || !deskPlate || !lamp) {
				console.error('Could not find the laptop base, desk plate, or lamp');
				onError();
				return;
			}
			const baseBounds = new THREE.Box3().setFromObject(basePanel);
			const plateBounds = new THREE.Box3().setFromObject(deskPlate);
			const screenBounds = new THREE.Box3().setFromObject(screenMesh);
			const screenCenter = screenBounds.getCenter(new THREE.Vector3());
			const plateCenter = plateBounds.getCenter(new THREE.Vector3());
			desk.position.add(
				new THREE.Vector3(
					screenCenter.x - plateCenter.x,
					baseBounds.min.y - plateBounds.max.y - 0.0005,
					screenCenter.z - plateCenter.z
				)
			);
			desk.updateWorldMatrix(true, true);
			laptop.position.z -= 0.06;
			laptop.updateWorldMatrix(true, true);
			laptop.traverse((object) => {
				if (object instanceof THREE.Mesh) object.castShadow = true;
			});
			desk.traverse((object) => {
				if (!(object instanceof THREE.Mesh)) return;
				object.castShadow = !isWithin(object, lamp!);
				object.receiveShadow = true;
				for (const material of Array.isArray(object.material)
					? object.material
					: [object.material]) {
					if (!(material instanceof THREE.MeshStandardMaterial)) continue;
					if (material.name === 'Material') deskSurfaceMaterial = material;
					if (material.name === 'Material.006') lampShadeMaterial = material;
				}
			});
			deskSurfaceMaterial?.color.copy(darkMode ? darkDesk : lightDesk);
			lampShadeMaterial?.color.copy(darkMode ? darkShade : lightShade);
			const lampBounds = new THREE.Box3().setFromObject(lamp);
			lampBounds.getCenter(lampAnchor);
			lampAnchor.y = lampBounds.max.y + 0.05;
			// The shade ends near this height; emit just below it so the desk receives the light.
			lampLight.position.set(lampAnchor.x, lampBounds.max.y - 0.13, lampAnchor.z);
			lampLight.target.position.set(
				lampAnchor.x + 0.12,
				plateBounds.max.y + desk.position.y,
				lampAnchor.z + 0.02
			);
			bulb.position.copy(lampLight.position);
			const screenSize = screenBounds.getSize(new THREE.Vector3());
			// The screen mesh is tilted, so its world-space Y bounds are shorter than its surface.
			screenObject.scale.set(screenSize.x / SCREEN.width, screenSize.y / SCREEN.fitHeight, 1);
			screenSurfaceWidth = screenSize.x;
			screenSurfaceHeight = (screenSize.y * SCREEN.height) / SCREEN.fitHeight;
			screenMesh.updateWorldMatrix(true, false);
			screenMesh.getWorldPosition(screenPosition);
			screenObject.position.copy(screenPosition);
			const orientation = screenMesh.getWorldQuaternion(new THREE.Quaternion());
			const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.2);
			screenObject.quaternion.copy(orientation).multiply(tilt);
			screenOffset.set(0, 0, 1).applyQuaternion(screenObject.quaternion).multiplyScalar(0.0001);
			screenObject.position.add(screenOffset);
			yaw.position.copy(screenPosition);
		} else {
			if (laptopResult.status === 'fulfilled') disposeModel(laptopResult.value.scene);
			if (deskResult.status === 'fulfilled') disposeModel(deskResult.value.scene);
			if (!disposed) {
				console.error('Could not load the 3D models', laptopResult, deskResult);
				onError();
			}
		}
	});

	const render = () => {
		if (disposed) return;
		frameId = requestAnimationFrame(render);
		const transition = 0.09;
		background.lerp(darkMode ? darkBackground : lightBackground, transition);
		ambientLight.intensity = THREE.MathUtils.lerp(
			ambientLight.intensity,
			darkMode ? 0.6 : 1.6,
			transition
		);
		keyLight.intensity = THREE.MathUtils.lerp(
			keyLight.intensity,
			darkMode ? 0.65 : 1.5,
			transition
		);
		lampLight.intensity = THREE.MathUtils.lerp(
			lampLight.intensity,
			darkMode ? 0.08 : 0,
			transition
		);
		bulbMaterial.opacity = THREE.MathUtils.lerp(bulbMaterial.opacity, darkMode ? 1 : 0, transition);
		bulb.visible = bulbMaterial.opacity > 0.01;
		deskSurfaceMaterial?.color.lerp(darkMode ? darkDesk : lightDesk, transition);
		lampShadeMaterial?.color.lerp(darkMode ? darkShade : lightShade, transition);
		if (laptop && screenMesh) {
			const elapsed = THREE.MathUtils.clamp(
				(performance.now() - focusStarted) / CAMERA.focusDuration,
				0,
				1
			);
			const eased = elapsed * elapsed * (3 - 2 * elapsed);
			focusAmount = THREE.MathUtils.lerp(focusFrom, focused ? 1 : 0, eased);
			lift = THREE.MathUtils.lerp(lift, hovered === 'laptop' || focused ? CAMERA.lift : 0, 0.08);
			laptop.position.y = laptopStartY + lift;
			screenMesh.getWorldPosition(screenPosition);
			screenObject.position.copy(screenPosition).add(screenOffset);
			yaw.position.lerp(screenPosition, 0.1);
			cameraDistance = THREE.MathUtils.lerp(
				CAMERA.overviewDistance,
				CAMERA.focusDistance,
				focusAmount
			);
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
				CAMERA.overviewHeight,
				CAMERA.focusHeight,
				focusAmount
			);
			camera.position.z = cameraDistance;
			camera.lookAt(screenPosition);
			camera.updateWorldMatrix(true, false);
			if (hovered === 'lamp') tooltipPosition.copy(lampAnchor);
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
	};
	render();

	return {
		enterFocus: () => setFocused(true),
		getScreenRect: () => {
			const { left, top, width, height } = iframe.getBoundingClientRect();
			return { left, top, width, height };
		},
		setDarkMode,
		exitFocus: () => setFocused(false),
		dispose: () => {
			if (disposed) return;
			disposed = true;
			cancelAnimationFrame(frameId);
			resizeObserver.disconnect();
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerup', onPointerUp);
			canvas.removeEventListener('pointercancel', onPointerCancel);
			canvas.removeEventListener('pointerleave', onPointerLeave);
			window.removeEventListener('keydown', onKeyDown);
			iframe.removeEventListener('load', onIframeLoad);
			iframe.contentWindow?.removeEventListener('keydown', onKeyDown);
			cssRenderer.domElement.remove();
			if (laptop) disposeModel(laptop);
			if (desk) disposeModel(desk);
			bulb.geometry.dispose();
			bulbMaterial.dispose();
			lampLight.shadow.dispose();
			renderer.dispose();
		}
	};
}
