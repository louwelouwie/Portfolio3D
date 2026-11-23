import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { asset } from '$app/paths';
import type { ScreenQuad } from './projectElementToQuad.js';
import { createLampSound } from './createLampSound.js';
import { createCoffeeInteraction } from './createCoffeeInteraction.js';
import {
	createForegroundPresentation,
	type SurfaceCorners
} from './createForegroundPresentation.js';
import { createPrinterPaper } from './createPrinterPaper.js';
import { createPopAnimation, withBottomPivot } from './createPopAnimation.js';
import { CARD_MESH_NAMES, type CardMeshName } from './deviceScreens.js';

type ThemeChangeOptions = { playSound?: boolean; manual?: boolean };

export type PortfolioScene = {
	enterFocus: (target: FocusTarget) => void;
	getScreenQuad: (target: ScreenTarget) => ScreenQuad | null;
	getCardProjection: (
		name: CardMeshName
	) => { quad: ScreenQuad; aspect: number; foreground: boolean } | null;
	getPaperProjection: () => { quad: ScreenQuad; aspect: number } | null;
	getForegroundMaskPath: () => string;
	setDarkMode: (value: boolean, options?: ThemeChangeOptions) => void;
	setSoundEnabled: (value: boolean) => void;
	exitFocus: () => void;
	dispose: () => void;
};

export type ScreenTarget = 'laptop' | 'phone' | 'embedded';
type ForegroundTarget = 'card' | 'printer';
export type FocusTarget = ScreenTarget | ForegroundTarget;
export type HoverTarget = FocusTarget | 'lamp' | 'headphones' | 'coffee' | null;

type SceneEvents = {
	onError: () => void;
	onFrame: () => void;
	onHoverChange: (target: HoverTarget) => void;
	onFocusChange: (focused: FocusTarget | null) => void;
	onFocusReady: () => void;
	onThemeChange: (darkMode: boolean, manual: boolean) => void;
	onSoundChange: (enabled: boolean) => void;
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
	flatAimFraction: 0.22,
	flatTravelEnd: 0.82,
	themeDuration: 500,
	yawLimit: 0.38,
	pitchLimit: 0.18,
	cursorYaw: 0.032,
	cursorPitch: 0.018,
	rotationLerp: 0.08,
	lift: 0.015
} as const;

const FLAT_DEVICE_LIFT = 0.008;

function isForegroundTarget(target: HoverTarget): target is ForegroundTarget {
	return target === 'card' || target === 'printer';
}

type FlatScreen = {
	mesh: THREE.Mesh;
	center: THREE.Vector3;
	corners: SurfaceCorners;
	width: number;
	height: number;
};

function getCardFaceCorners(mesh: THREE.Mesh): SurfaceCorners | null {
	const uv = mesh.geometry.getAttribute('uv');
	const positions = mesh.geometry.getAttribute('position');
	if (!uv || !positions) return null;
	const cornerAt = (u: number, v: number) => {
		for (let index = 0; index < uv.count; index++) {
			if (uv.getX(index) === u && uv.getY(index) === v)
				return new THREE.Vector3().fromBufferAttribute(positions, index);
		}
		return null;
	};
	const topLeft = cornerAt(0, 0);
	const topRight = cornerAt(1, 0);
	const bottomRight = cornerAt(1, 1);
	const bottomLeft = cornerAt(0, 1);
	return topLeft && topRight && bottomRight && bottomLeft
		? [topLeft, topRight, bottomRight, bottomLeft]
		: null;
}

function createFlatScreen(mesh: THREE.Mesh, portrait: boolean): FlatScreen {
	mesh.geometry.computeBoundingBox();
	const bounds = mesh.geometry.boundingBox!;
	const left = bounds.min.x + 0.001;
	const right = bounds.max.x - 0.001;
	const back = bounds.min.z + 0.001;
	const front = bounds.max.z - 0.001;
	const y = bounds.max.y + 0.0002;
	const point = (x: number, z: number) => new THREE.Vector3(x, y, z);
	return {
		mesh,
		center: point((left + right) / 2, (back + front) / 2),
		corners: portrait
			? [point(right, back), point(right, front), point(left, front), point(left, back)]
			: [point(left, back), point(right, back), point(right, front), point(left, front)],
		width: portrait ? front - back : right - left,
		height: portrait ? right - left : front - back
	};
}

function smoothstep(value: number) {
	const t = THREE.MathUtils.clamp(value, 0, 1);
	return t * t * (3 - 2 * t);
}

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
		onFocusReady,
		onThemeChange,
		onSoundChange,
		initialDarkMode,
		initialSoundEnabled
	}: SceneEvents
): PortfolioScene {
	const scene = new THREE.Scene();
	const foreground = new THREE.Group();
	scene.add(foreground);
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
	const pop = createPopAnimation(reducedMotion);
	const lampSound = createLampSound();
	const darkBackground = new THREE.Color(0x14233a);
	const lightBackground = new THREE.Color(0xe7f0ff);
	const background = (initialDarkMode ? darkBackground : lightBackground).clone();
	scene.background = background;
	const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.shadowMap.enabled = true;

	const camera = new THREE.PerspectiveCamera(60, 1, 0.02, 10);
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
	const screenObject = new THREE.Object3D();
	screenObject.visible = false;

	let focused: FocusTarget | null = null;
	let lastFocused: ScreenTarget = 'laptop';
	let focusRequested: FocusTarget | null = null;
	let hovered: HoverTarget = null;
	let tooltipAnchor: HoverTarget = null;
	let lampExitUntil = 0;
	let hoverTimer: ReturnType<typeof setTimeout> | undefined;
	let hoverX = 0;
	let hoverY = 0;
	let darkMode = initialDarkMode;
	let themeAmount = initialDarkMode ? 1 : 0;
	let themeFrom = themeAmount;
	let themeStarted = 0;
	let soundEnabled = initialSoundEnabled;
	let dragMode: 'overview' | 'foreground' | null = null;
	let dragged = false;
	let activePointer: number | undefined;
	let startX = 0;
	let startY = 0;
	let lastX = 0;
	let lastY = 0;
	let targetYaw = 0;
	let targetPitch = 0;
	const cursorOffset = new THREE.Vector2();
	const foregroundRotation = new THREE.Euler(0, 0, 0, 'YXZ');
	const foregroundQuaternion = new THREE.Quaternion();
	const foregroundBounds = new THREE.Box3();
	let foregroundReady = false;
	let focusReady = false;
	let lift = 0;
	let lampLift = 0;
	let phoneLift = 0;
	let embeddedLift = 0;
	let headphonesLift = 0;
	let cardHolderLift = 0;
	let printerLift = 0;
	let laptopStartY = 0;
	let lampStartY = 0;
	let phoneStartY = 0;
	let embeddedStartY = 0;
	let headphoneStartY = 0;
	let standStartY = 0;
	let cardHolderStartY = 0;
	let printerStartY = 0;
	let lampLightStartY = 0;
	let laptopTopY = 0;
	let cameraDistance: number = CAMERA.overviewDistance;
	let focusAmount = 0;
	let focusFrom = 0;
	let focusStarted = 0;
	let presentationAmount = 0;
	let presentationFrom = 0;
	let presentationStarted = 0;
	let activePresentation:
		| { target: ForegroundTarget; motion: ReturnType<typeof createForegroundPresentation> }
		| undefined;
	let screenSurfaceWidth = 0;
	let screenSurfaceHeight = 0;
	let laptop: THREE.Object3D | undefined;
	let phone: THREE.Object3D | undefined;
	let embedded: THREE.Object3D | undefined;
	let phoneScreen: FlatScreen | undefined;
	let embeddedScreen: FlatScreen | undefined;
	let desk: THREE.Object3D | undefined;
	let deskPlate: THREE.Object3D | undefined;
	let deskPopGroup: THREE.Group | undefined;
	let lamp: THREE.Object3D | undefined;
	let headphone: THREE.Object3D | undefined;
	let headphoneStand: THREE.Object3D | undefined;
	let cardHolder: THREE.Object3D | undefined;
	let mug: THREE.Object3D | undefined;
	let coffee: ReturnType<typeof createCoffeeInteraction> | undefined;
	let printer: THREE.Mesh | undefined;
	let printerPaper: ReturnType<typeof createPrinterPaper>;
	let cardPresentation: ReturnType<typeof createForegroundPresentation> | undefined;
	const cardFaces = new Map<
		CardMeshName,
		{ mesh: THREE.Mesh; corners: SurfaceCorners; aspect: number }
	>();
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
	const localScreenCorners: SurfaceCorners = [
		new THREE.Vector3(),
		new THREE.Vector3(),
		new THREE.Vector3(),
		new THREE.Vector3()
	];
	const projectedCorner = new THREE.Vector3();
	const screenOffset = new THREE.Vector3();
	const tooltipPosition = new THREE.Vector3();
	const lampAnchor = new THREE.Vector3();
	const headphoneAnchor = new THREE.Vector3();
	const screenPlane = new THREE.Plane();
	const screenIntersection = new THREE.Vector3();
	const screenLocal = new THREE.Vector3();
	const screenNormal = new THREE.Vector3();
	const inverseScreenRotation = new THREE.Quaternion();
	const cameraWorld = new THREE.Vector3();
	const flatScreenPosition = new THREE.Vector3();
	const flatStartPosition = new THREE.Vector3();
	const flatStartRotation = new THREE.Quaternion();
	const flatEndPosition = new THREE.Vector3();
	const flatEndRotation = new THREE.Quaternion();
	const flatScreenUp = new THREE.Vector3();
	const flatApproachUp = new THREE.Vector3();
	const flatApproachRotation = new THREE.Quaternion();
	const lookAtMatrix = new THREE.Matrix4();
	const inverseRigRotation = new THREE.Quaternion();
	const cardAnchor = new THREE.Vector3();
	const printerAnchor = new THREE.Vector3();
	const maskTriangle = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
	const projectQuad = (
		mesh: THREE.Mesh,
		corners: SurfaceCorners,
		frontOnly = false
	): ScreenQuad | null => {
		const rect = canvas.getBoundingClientRect();
		let clipped = false;
		const project = (corner: THREE.Vector3) => {
			projectedCorner.copy(corner).applyMatrix4(mesh.matrixWorld).project(camera);
			if (projectedCorner.z < -1 || projectedCorner.z > 1) clipped = true;
			return {
				x: rect.left + (projectedCorner.x * 0.5 + 0.5) * rect.width,
				y: rect.top + (0.5 - projectedCorner.y * 0.5) * rect.height
			};
		};
		const quad = [
			project(corners[0]),
			project(corners[1]),
			project(corners[2]),
			project(corners[3])
		] as const;
		if (frontOnly) {
			const [a, b, c] = quad;
			const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
			if (clipped || area <= 0.01) return null;
		}
		return quad;
	};

	const isWithin = (object: THREE.Object3D, parent: THREE.Object3D) => {
		for (let current: THREE.Object3D | null = object; current; current = current.parent) {
			if (current === parent) return true;
		}
		return false;
	};
	const pointRayAtCursor = (clientX: number, clientY: number) => {
		const rect = canvas.getBoundingClientRect();
		pointer.set(
			((clientX - rect.left) / rect.width) * 2 - 1,
			-((clientY - rect.top) / rect.height) * 2 + 1
		);
		camera.updateWorldMatrix(true, false);
		raycaster.setFromCamera(pointer, camera);
	};
	const hitForeground = (clientX: number, clientY: number) => {
		pointRayAtCursor(clientX, clientY);
		foregroundBounds.setFromObject(foreground).expandByScalar(0.012);
		return raycaster.ray.intersectsBox(foregroundBounds);
	};
	const hitTarget = (clientX: number, clientY: number): HoverTarget => {
		pointRayAtCursor(clientX, clientY);
		if (!laptop || !desk || !pop.finished) return null;
		const hit = raycaster.intersectObjects([laptop, desk], true)[0];
		if (hit && lamp && isWithin(hit.object, lamp)) return 'lamp';
		if (
			hit &&
			((headphone && isWithin(hit.object, headphone)) ||
				(headphoneStand && isWithin(hit.object, headphoneStand)))
		)
			return 'headphones';
		if (hit && cardHolder && isWithin(hit.object, cardHolder)) return 'card';
		if (hit && printer && printerPaper && isWithin(hit.object, printer)) return 'printer';
		if (hit && coffee && mug && isWithin(hit.object, mug)) return 'coffee';
		if (hit && phone && isWithin(hit.object, phone)) return 'phone';
		if (hit && embedded && isWithin(hit.object, embedded)) return 'embedded';
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
		canvas.style.cursor = next ? 'pointer' : dragMode ? 'grabbing' : 'grab';
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
					if (!focused && !dragMode && hitTarget(hoverX, hoverY) === 'laptop') setHovered('laptop');
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
	const setDarkMode = (
		next: boolean,
		{ playSound = false, manual = false }: ThemeChangeOptions = {}
	) => {
		if (darkMode === next) return;
		if (playSound && soundEnabled) void lampSound.play(next);
		themeFrom = themeAmount;
		themeStarted = performance.now();
		darkMode = next;
		onThemeChange(next, manual);
	};
	const endDrag = () => {
		if (activePointer !== undefined && canvas.hasPointerCapture(activePointer))
			canvas.releasePointerCapture(activePointer);
		activePointer = undefined;
		dragMode = null;
	};
	const setFocused = (next: FocusTarget | null) => {
		if (focused === next) return;
		if (
			next &&
			!focused &&
			((focusAmount > 0 && next !== lastFocused) ||
				(activePresentation && next !== activePresentation.target))
		) {
			focusRequested = next;
			return;
		}
		focusRequested = null;
		if (isForegroundTarget(next) && !activePresentation) {
			const motion = next === 'card' ? cardPresentation : printerPaper?.presentation;
			if (!motion) return;
			activePresentation = { target: next, motion };
			foregroundRotation.set(0, 0, 0);
		}
		endDrag();
		foregroundReady = false;
		focusReady = false;
		cursorOffset.set(0, 0);
		clearTimeout(hoverTimer);
		hoverTimer = undefined;
		if ((next === 'phone' || next === 'embedded') && focusAmount === 0) {
			camera.getWorldPosition(flatStartPosition);
			camera.getWorldQuaternion(flatStartRotation);
		}
		presentationFrom = presentationAmount;
		presentationStarted = performance.now();
		focused = next;
		if (next && !isForegroundTarget(next)) lastFocused = next;
		focusFrom = focusAmount;
		focusStarted = performance.now();
		setHovered(null);
		canvas.style.cursor = next ? 'default' : 'grab';
		onFocusChange(next);
	};
	const onPointerDown = (event: PointerEvent) => {
		if (event.button !== 0 || dragMode) return;
		if (focused && (!foregroundReady || !hitForeground(event.clientX, event.clientY))) return;
		clearTimeout(hoverTimer);
		hoverTimer = undefined;
		dragMode = focused ? 'foreground' : 'overview';
		dragged = false;
		activePointer = event.pointerId;
		startX = lastX = event.clientX;
		startY = lastY = event.clientY;
		canvas.setPointerCapture(event.pointerId);
		canvas.style.cursor = 'grabbing';
	};
	const onPointerMove = (event: PointerEvent) => {
		if (dragMode) {
			if (activePointer !== event.pointerId) return;
			if (Math.hypot(event.clientX - startX, event.clientY - startY) > 5) dragged = true;
			if (dragged) {
				const dx = event.clientX - lastX;
				const dy = event.clientY - lastY;
				if (dragMode === 'foreground') {
					foregroundRotation.y += dx * 0.012;
					foregroundRotation.x = THREE.MathUtils.clamp(
						foregroundRotation.x + dy * 0.008,
						-0.8,
						0.8
					);
				} else {
					targetYaw = THREE.MathUtils.clamp(
						targetYaw - dx * 0.003,
						-CAMERA.yawLimit,
						CAMERA.yawLimit
					);
					targetPitch = THREE.MathUtils.clamp(
						targetPitch - dy * 0.0025,
						-CAMERA.pitchLimit,
						CAMERA.pitchLimit
					);
					setHovered(null);
				}
			}
			lastX = event.clientX;
			lastY = event.clientY;
			return;
		}
		if (focused) {
			canvas.style.cursor =
				foregroundReady && hitForeground(event.clientX, event.clientY) ? 'grab' : 'default';
			return;
		}
		const target = hitTarget(event.clientX, event.clientY);
		if (event.pointerType === 'mouse')
			cursorOffset.set(pointer.x * CAMERA.cursorYaw, -pointer.y * CAMERA.cursorPitch);
		updateHover(target, event.clientX, event.clientY);
	};
	const onPointerUp = (event: PointerEvent) => {
		if (!dragMode || activePointer !== event.pointerId) return;
		const mode = dragMode;
		endDrag();
		if (mode === 'foreground') {
			canvas.style.cursor = hitForeground(event.clientX, event.clientY) ? 'grab' : 'default';
			return;
		}
		const target = hitTarget(event.clientX, event.clientY);
		if (
			!dragged &&
			(target === 'laptop' ||
				target === 'phone' ||
				target === 'embedded' ||
				isForegroundTarget(target))
		)
			setFocused(target);
		else if (!dragged && target === 'lamp')
			setDarkMode(!darkMode, { playSound: true, manual: true });
		else if (!dragged && target === 'headphones') {
			soundEnabled = !soundEnabled;
			onSoundChange(soundEnabled);
		} else if (!dragged && target === 'coffee') coffee?.sip(cameraWorld);
		if (!focused) updateHover(target, event.clientX, event.clientY);
	};
	const onPointerCancel = () => {
		endDrag();
		cursorOffset.set(0, 0);
		clearTimeout(hoverTimer);
		hoverTimer = undefined;
		setHovered(null);
		if (focused) canvas.style.cursor = 'default';
	};
	const onPointerLeave = () => {
		cursorOffset.set(0, 0);
		if (!dragMode) {
			clearTimeout(hoverTimer);
			hoverTimer = undefined;
			setHovered(null);
			if (focused) canvas.style.cursor = 'default';
		}
	};
	const onResize = () => {
		const { clientWidth: width, clientHeight: height } = container;
		if (!width || !height) return;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height);
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
			const phoneCandidate = model.getObjectByName('Phone_Base');
			const phoneScreenCandidate = model.getObjectByName('Phone_Screen');
			const embeddedCandidate = model.getObjectByName('Embedded_Base');
			const embeddedScreenCandidate = model.getObjectByName('Embedded_Screen');
			const headphoneCandidate = model.getObjectByName('Headphone');
			const standCandidate = model.getObjectByName('HeadphoneStand');
			const cardHolderCandidate = model.getObjectByName('Cardholder_Base');
			const frontCardCandidate = model.getObjectByName('Card');
			const printerCandidate = model.getObjectByName('Printer_Base');
			const paperCandidate = printerCandidate?.getObjectByName('Printer_Paper');
			mug = model.getObjectByName('Mug_Base');
			const coffeeFluid = mug?.getObjectByName('Mug_Fluid');
			if (
				!laptopCandidate ||
				!(screenCandidate instanceof THREE.Mesh) ||
				!deskCandidate ||
				!lampCandidate ||
				!(bulbCandidate instanceof THREE.Mesh) ||
				!phoneCandidate ||
				!(phoneScreenCandidate instanceof THREE.Mesh) ||
				!embeddedCandidate ||
				!(embeddedScreenCandidate instanceof THREE.Mesh) ||
				!headphoneCandidate ||
				!standCandidate ||
				!cardHolderCandidate ||
				!(frontCardCandidate instanceof THREE.Mesh)
			) {
				console.error('Desk model is missing a required interactive mesh');
				disposeModel(model);
				onError();
				return;
			}
			desk = model;
			laptop = laptopCandidate;
			screenMesh = screenCandidate;
			deskPlate = deskCandidate;
			lamp = lampCandidate;
			phone = phoneCandidate;
			embedded = embeddedCandidate;
			headphone = headphoneCandidate;
			headphoneStand = standCandidate;
			cardHolder = cardHolderCandidate;
			if (printerCandidate instanceof THREE.Mesh && paperCandidate instanceof THREE.Mesh) {
				printer = printerCandidate;
				printerPaper = createPrinterPaper(printer, paperCandidate, foreground);
			}
			phoneScreen = createFlatScreen(phoneScreenCandidate, true);
			embeddedScreen = createFlatScreen(embeddedScreenCandidate, false);
			cardHolderCandidate.traverse((mesh) => {
				// The loader keeps the Blender name in userData when sanitizing names like Card.001.
				const name = CARD_MESH_NAMES.find((name) => name === mesh.userData.name);
				if (!name || !(mesh instanceof THREE.Mesh)) return;
				const corners = getCardFaceCorners(mesh);
				if (corners) {
					const topLeft = mesh.localToWorld(corners[0].clone());
					const bottomRight = mesh.localToWorld(corners[2].clone());
					const bottomLeft = mesh.localToWorld(corners[3].clone());
					const width = bottomLeft.distanceTo(bottomRight);
					const height = bottomLeft.distanceTo(topLeft);
					if (width && height) cardFaces.set(name, { mesh, corners, aspect: width / height });
				}
				mesh.material = new THREE.MeshStandardMaterial({ color: 0xf7fbff, side: THREE.DoubleSide });
			});
			const corners = cardFaces.get('Card')?.corners;
			if (!corners) throw new Error('The front card needs UVs at all four corners');
			cardPresentation = createForegroundPresentation(frontCardCandidate, corners, foreground);
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
			const headphoneBounds = new THREE.Box3()
				.setFromObject(headphoneCandidate)
				.expandByObject(standCandidate);
			headphoneBounds.getCenter(headphoneAnchor);
			headphoneAnchor.y = headphoneBounds.max.y + 0.05;
			const cardHolderBounds = new THREE.Box3().setFromObject(cardHolder);
			cardHolderBounds.getCenter(cardAnchor);
			cardAnchor.y = cardHolderBounds.max.y + 0.05;
			if (printer) {
				const bounds = new THREE.Box3().setFromObject(printer);
				bounds.getCenter(printerAnchor);
				printerAnchor.y = bounds.max.y + 0.05;
			}
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
				if (object === lamp) lampPopGroup = group;
				if (object === mug && coffeeFluid)
					coffee = createCoffeeInteraction(group, coffeeFluid, reducedMotion);
				pop.add(group, 250 + index * 30, 500);
			}
			laptopStartY = laptop.position.y;
			lampStartY = lamp.position.y;
			phoneStartY = phone.position.y;
			embeddedStartY = embedded.position.y;
			headphoneStartY = headphone.position.y;
			standStartY = headphoneStand.position.y;
			cardHolderStartY = cardHolder.position.y;
			printerStartY = printer?.position.y ?? 0;
			lampLightStartY = lampLight.position.y;
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
		const now = performance.now();
		if (deskPopGroup) pop.update(deskPopGroup, now);
		let lampPop = 1;
		for (const group of propPopGroups) {
			const scale = pop.update(group, now);
			if (group === lampPopGroup) lampPop = scale;
		}
		coffee?.update(now);
		if (lamp) {
			lampLift = THREE.MathUtils.lerp(lampLift, hovered === 'lamp' && !focused ? 0.012 : 0, 0.08);
			lamp.position.y = lampStartY + lampLift;
			lampLight.position.y = lampLightStartY + lampLift;
		}
		if (phone) {
			phoneLift = THREE.MathUtils.lerp(
				phoneLift,
				hovered === 'phone' || focused === 'phone' || (lastFocused === 'phone' && focusAmount > 0)
					? FLAT_DEVICE_LIFT
					: 0,
				0.08
			);
			phone.position.y = phoneStartY + phoneLift;
		}
		if (embedded) {
			embeddedLift = THREE.MathUtils.lerp(
				embeddedLift,
				hovered === 'embedded' ||
					focused === 'embedded' ||
					(lastFocused === 'embedded' && focusAmount > 0)
					? FLAT_DEVICE_LIFT
					: 0,
				0.08
			);
			embedded.position.y = embeddedStartY + embeddedLift;
		}
		if (headphone && headphoneStand) {
			headphonesLift = THREE.MathUtils.lerp(
				headphonesLift,
				hovered === 'headphones' && !focused ? 0.012 : 0,
				0.08
			);
			headphone.position.y = headphoneStartY + headphonesLift;
			headphoneStand.position.y = standStartY + headphonesLift;
		}
		if (cardHolder) {
			cardHolderLift = THREE.MathUtils.lerp(
				cardHolderLift,
				hovered === 'card' && !focused ? 0.012 : 0,
				0.08
			);
			cardHolder.position.y = cardHolderStartY + cardHolderLift;
		}
		if (printer) {
			printerLift = THREE.MathUtils.lerp(
				printerLift,
				hovered === 'printer' && !focused ? 0.012 : 0,
				0.08
			);
			printer.position.y = printerStartY + printerLift;
		}
		if (focusRequested && screenMesh && pop.finished && focusAmount === 0 && !activePresentation) {
			const requested = focusRequested;
			focusRequested = null;
			setFocused(requested);
		}
		const themeProgress = reducedMotion.matches
			? 1
			: smoothstep((now - themeStarted) / CAMERA.themeDuration);
		themeAmount = THREE.MathUtils.lerp(themeFrom, darkMode ? 1 : 0, themeProgress);
		background.copy(lightBackground).lerp(darkBackground, themeAmount);
		ambientLight.intensity = THREE.MathUtils.lerp(0.85, 0.6, themeAmount);
		keyLight.intensity = THREE.MathUtils.lerp(0.35, 0.65, themeAmount);
		daylight.intensity = THREE.MathUtils.lerp(1.5, 0, themeAmount);
		lampLight.intensity = 1.2 * themeAmount * Math.min(lampPop, 1);
		if (lampBulbMaterial) lampBulbMaterial.emissiveIntensity = 1.6 * themeAmount;
		if (laptop && screenMesh) {
			const flatScreen =
				lastFocused === 'phone'
					? phoneScreen
					: lastFocused === 'embedded'
						? embeddedScreen
						: undefined;
			const elapsed = reducedMotion.matches
				? 1
				: THREE.MathUtils.clamp((now - focusStarted) / CAMERA.focusDuration, 0, 1);
			focusAmount = THREE.MathUtils.lerp(
				focusFrom,
				focused && !isForegroundTarget(focused) ? 1 : 0,
				flatScreen ? elapsed : smoothstep(elapsed)
			);
			lift = THREE.MathUtils.lerp(
				lift,
				hovered === 'laptop' || focused === 'laptop' ? CAMERA.lift : 0,
				0.08
			);
			laptop.position.y = laptopStartY + lift;
			screenMesh.localToWorld(screenPosition.copy(localScreenCenter));
			screenObject.position.copy(screenPosition).add(screenOffset);
			const narrow = container.clientWidth < 640;
			if (flatScreen && focusAmount > 0) {
				const isPhone = lastFocused === 'phone';
				flatScreen.mesh.localToWorld(flatScreenPosition.copy(flatScreen.center));
				flatScreenPosition.y += FLAT_DEVICE_LIFT - (isPhone ? phoneLift : embeddedLift);
				flatScreenUp.copy(flatScreen.corners[0]).sub(flatScreen.corners[3]);
				flatScreenUp.transformDirection(flatScreen.mesh.matrixWorld);
				const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
				const phoneFill = narrow ? Math.min(0.84, 1 - 148 / container.clientHeight) : 0.9;
				const verticalFill = isPhone ? phoneFill : 0.78;
				const distance = Math.max(
					isPhone ? 0.07 : 0.06,
					flatScreen.height / (2 * halfFov * verticalFill),
					flatScreen.width / (2 * halfFov * camera.aspect * 0.88)
				);
				flatEndPosition.copy(flatScreenPosition);
				flatEndPosition.y += distance;
				lookAtMatrix.lookAt(flatEndPosition, flatScreenPosition, flatScreenUp);
				flatEndRotation.setFromRotationMatrix(lookAtMatrix);

				// Aim at the screen, approach it on a straight line, then align with its top edge.
				const aim = smoothstep(focusAmount / CAMERA.flatAimFraction);
				const travel = smoothstep(
					(focusAmount - CAMERA.flatAimFraction) / (CAMERA.flatTravelEnd - CAMERA.flatAimFraction)
				);
				const align = smoothstep((focusAmount - CAMERA.flatTravelEnd) / (1 - CAMERA.flatTravelEnd));
				camera.position.copy(flatStartPosition).lerp(flatEndPosition, travel);
				flatApproachUp.copy(flatScreenPosition).sub(flatStartPosition);
				flatApproachUp.y = 0;
				if (flatApproachUp.lengthSq() < 0.000001) flatApproachUp.copy(flatScreenUp);
				lookAtMatrix.lookAt(camera.position, flatScreenPosition, flatApproachUp.normalize());
				flatApproachRotation.setFromRotationMatrix(lookAtMatrix);
				pitch.worldToLocal(camera.position);
				pitch.getWorldQuaternion(inverseRigRotation).invert();
				camera.quaternion
					.copy(flatStartRotation)
					.slerp(flatApproachRotation, aim)
					.slerp(flatEndRotation, align)
					.premultiply(inverseRigRotation);
			} else {
				const laptopDistance = Math.max(
					CAMERA.focusDistance,
					(CAMERA.focusDistance * (narrow ? CAMERA.phoneFocusAspect : CAMERA.desktopFocusAspect)) /
						camera.aspect
				);
				yaw.position.lerp(screenPosition, 0.1);
				cameraDistance = THREE.MathUtils.lerp(CAMERA.overviewDistance, laptopDistance, focusAmount);
				const cursorWeight =
					focused || activePresentation || reducedMotion.matches ? 0 : 1 - focusAmount;
				yaw.rotation.y = THREE.MathUtils.lerp(
					yaw.rotation.y,
					targetYaw * (1 - focusAmount) + cursorOffset.x * cursorWeight,
					CAMERA.rotationLerp
				);
				pitch.rotation.x = THREE.MathUtils.lerp(
					pitch.rotation.x,
					targetPitch * (1 - focusAmount) + cursorOffset.y * cursorWeight,
					CAMERA.rotationLerp
				);
				const cameraHeight = THREE.MathUtils.lerp(
					narrow ? CAMERA.phoneOverviewHeight : CAMERA.overviewHeight,
					narrow ? CAMERA.phoneFocusHeight : CAMERA.focusHeight,
					focusAmount
				);
				camera.position.set(0, cameraHeight, cameraDistance);
				camera.lookAt(screenPosition);
			}
			camera.updateWorldMatrix(true, false);
			camera.getWorldPosition(cameraWorld);
			if (activePresentation) {
				const opening = focused === activePresentation.target;
				const duration = activePresentation.target === 'printer' ? 1700 : CAMERA.focusDuration;
				const progress = reducedMotion.matches
					? 1
					: THREE.MathUtils.clamp((now - presentationStarted) / duration, 0, 1);
				presentationAmount = THREE.MathUtils.lerp(presentationFrom, opening ? 1 : 0, progress);
				activePresentation.motion.update(
					presentationAmount,
					camera,
					foregroundQuaternion.setFromEuler(foregroundRotation)
				);
				foregroundReady = opening && presentationAmount === 1;
				if (!opening && presentationAmount === 0) activePresentation = undefined;
			}
			daylight.position.set(cameraWorld.x - 0.25, cameraWorld.y + 0.7, cameraWorld.z + 0.4);
			if (tooltipAnchor === 'lamp') {
				tooltipPosition.copy(lampAnchor);
				tooltipPosition.y += lampLift;
			} else if (tooltipAnchor === 'phone' && phoneScreen) {
				phoneScreen.mesh.localToWorld(tooltipPosition.copy(phoneScreen.center));
				tooltipPosition.y += 0.06;
			} else if (tooltipAnchor === 'embedded' && embeddedScreen) {
				embeddedScreen.mesh.localToWorld(tooltipPosition.copy(embeddedScreen.center));
				tooltipPosition.y += 0.06;
			} else if (tooltipAnchor === 'headphones' && headphone) {
				tooltipPosition.copy(headphoneAnchor);
				tooltipPosition.y += headphonesLift;
			} else if (tooltipAnchor === 'card') {
				tooltipPosition.copy(cardAnchor);
				tooltipPosition.y += cardHolderLift;
			} else if (tooltipAnchor === 'printer') {
				tooltipPosition.copy(printerAnchor);
				tooltipPosition.y += printerLift;
			} else if (tooltipAnchor === 'coffee' && mug) {
				mug.getWorldPosition(tooltipPosition);
				tooltipPosition.y += 0.075;
			} else tooltipPosition.set(screenPosition.x, laptopTopY + lift + 0.06, screenPosition.z);
			tooltipPosition.project(camera);
			tooltip.style.left = `${(tooltipPosition.x * 0.5 + 0.5) * container.clientWidth}px`;
			tooltip.style.top = `${(-tooltipPosition.y * 0.5 + 0.5) * container.clientHeight}px`;
		} else {
			camera.position.z = cameraDistance;
			camera.lookAt(0, 0, 0);
		}
		renderer.render(scene, camera);
		if (
			focused &&
			!focusReady &&
			(isForegroundTarget(focused) ? foregroundReady : focusAmount === 1)
		) {
			focusReady = true;
			onFocusReady();
		}
		onFrame();
	};
	render();

	return {
		enterFocus: (target) => {
			if (screenMesh && phoneScreen && embeddedScreen && pop.finished) setFocused(target);
			else focusRequested = target;
		},
		getScreenQuad: (target) => {
			const flat = target === 'phone' ? phoneScreen : target === 'embedded' ? embeddedScreen : null;
			const mesh = target === 'laptop' ? screenMesh : flat?.mesh;
			if (!mesh || !screenObject.visible) return null;
			return projectQuad(mesh, flat?.corners ?? localScreenCorners);
		},
		getCardProjection: (name) => {
			const face = cardFaces.get(name);
			if (!face || !screenObject.visible) return null;
			const quad = projectQuad(face.mesh, face.corners, true);
			return quad && { quad, aspect: face.aspect, foreground: face.mesh.parent === foreground };
		},
		getPaperProjection: () => {
			if (!printerPaper || printerPaper.mesh.parent !== foreground) return null;
			const quad = projectQuad(printerPaper.mesh, printerPaper.corners, true);
			return quad && { quad, aspect: printerPaper.aspect };
		},
		getForegroundMaskPath: () => {
			// The device iframes sit above WebGL, so mask them wherever a foreground mesh is visible.
			if (!foreground.children.length) return '';
			const { clientWidth: width, clientHeight: height } = container;
			let path = '';
			foreground.traverseVisible((object) => {
				if (!(object instanceof THREE.Mesh)) return;
				const positions = object.geometry.getAttribute('position');
				const indices = object.geometry.index;
				const count = indices?.count ?? positions.count;
				for (let index = 0; index + 2 < count; index += 3) {
					for (const [offset, point] of maskTriangle.entries()) {
						const vertex = indices ? indices.getX(index + offset) : index + offset;
						point
							.fromBufferAttribute(positions, vertex)
							.applyMatrix4(object.matrixWorld)
							.project(camera);
					}
					if (maskTriangle.some((point) => point.z < -1 || point.z > 1)) continue;
					const [a, b, c] = maskTriangle;
					const clockwise = (b.x - a.x) * (c.y - a.y) > (b.y - a.y) * (c.x - a.x);
					const toPixels = (point: THREE.Vector3) =>
						`${(point.x + 1) * width * 0.5} ${(1 - point.y) * height * 0.5}`;
					// A consistent winding makes overlapping triangles cover the same area of the mask.
					path += `M${toPixels(a)}L${toPixels(clockwise ? b : c)}L${toPixels(clockwise ? c : b)}Z`;
				}
			});
			return path;
		},
		setDarkMode,
		setSoundEnabled: (value) => (soundEnabled = value),
		exitFocus: () => {
			focusRequested = null;
			setFocused(null);
		},
		dispose: () => {
			if (disposed) return;
			disposed = true;
			endDrag();
			cancelAnimationFrame(frameId);
			clearTimeout(hoverTimer);
			activePresentation?.motion.update(0, camera, foregroundQuaternion);
			resizeObserver.disconnect();
			canvas.removeEventListener('pointerdown', onPointerDown);
			canvas.removeEventListener('pointermove', onPointerMove);
			canvas.removeEventListener('pointerup', onPointerUp);
			canvas.removeEventListener('pointercancel', onPointerCancel);
			canvas.removeEventListener('pointerleave', onPointerLeave);
			if (desk) disposeModel(desk);
			lampSound.dispose();
			lampLight.shadow.dispose();
			daylight.shadow.dispose();
			renderer.dispose();
		}
	};
}
