<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import type { HoverTarget, PortfolioScene } from '#lib/scene/createPortfolioScene.js';
	import { projectIframeToQuad } from '#lib/scene/projectIframeToQuad.js';
	import { LAPTOP_SCREEN } from '#lib/scene/deviceScreens.js';
	import { readDarkMode, saveDarkMode, themeStorageKey } from '#lib/theme.js';
	import HeroHeader from '#lib/components/HeroHeader.svelte';
	import SceneTooltip from '#lib/components/SceneTooltip.svelte';
	import SceneControls from '#lib/components/SceneControls.svelte';
	import SceneObjectControls from '#lib/components/SceneObjectControls.svelte';
	import { readSoundEnabled, saveSoundEnabled, soundStorageKey } from '#lib/sound.js';
	import {
		copy,
		languageStorageKey,
		readLanguage,
		saveLanguage,
		type Language
	} from '#lib/language.js';

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let tooltip = $state<HTMLDivElement>();
	let scene: PortfolioScene | undefined;
	let sceneError = $state(false);
	let hovered = $state<HoverTarget>(null);
	let lastTooltipTarget = $state<HoverTarget>(null);
	let focused = $state(false);
	let closeupReady = $state(false);
	let darkMode = $state(false);
	let soundEnabled = $state(true);
	let language = $state<Language>('en');
	let t = $derived(copy[language]);
	let laptopScreen = $state<HTMLIFrameElement>();
	let focusTimer: ReturnType<typeof setTimeout> | undefined;
	const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	function toggleTheme() {
		if (scene) scene.setDarkMode(!darkMode);
		else {
			darkMode = !darkMode;
			saveDarkMode(darkMode);
		}
	}

	function toggleLanguage() {
		language = language === 'en' ? 'nl' : 'en';
		saveLanguage(language);
	}

	function toggleSound() {
		soundEnabled = !soundEnabled;
		saveSoundEnabled(soundEnabled);
		scene?.setSoundEnabled(soundEnabled);
	}

	function updateFocus(value: boolean) {
		focused = value;
		clearTimeout(focusTimer);
		if (value) {
			focusTimer = setTimeout(() => (closeupReady = true), reducedMotion() ? 0 : 1000);
		} else {
			closeupReady = false;
		}
	}

	function syncScreen() {
		if (focused && closeupReady && laptopScreen && scene) {
			const quad = scene.getScreenQuad();
			if (quad)
				laptopScreen.style.transform = projectIframeToQuad(
					quad,
					LAPTOP_SCREEN.width,
					LAPTOP_SCREEN.height
				);
		}
	}

	onMount(() => {
		let cancelled = false;
		darkMode = readDarkMode();
		soundEnabled = readSoundEnabled();
		language = readLanguage();
		const onStorage = (event: StorageEvent) => {
			if (event.key === themeStorageKey) {
				darkMode = event.newValue === 'dark';
				scene?.setDarkMode(darkMode);
			}
			if (event.key === soundStorageKey) {
				soundEnabled = event.newValue !== 'false';
				scene?.setSoundEnabled(soundEnabled);
			}
			if (event.key === languageStorageKey) language = event.newValue === 'nl' ? 'nl' : 'en';
		};
		const onMessage = (event: MessageEvent) => {
			if (event.origin !== location.origin) return;
			if (event.data?.type === 'portfolio-exit' && event.source === laptopScreen?.contentWindow)
				scene?.exitFocus();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && focused) scene?.exitFocus();
		};
		window.addEventListener('storage', onStorage);
		window.addEventListener('message', onMessage);
		window.addEventListener('keydown', onKeyDown);
		import('#lib/scene/createPortfolioScene.js')
			.then(({ createPortfolioScene }) => {
				if (!cancelled) {
					scene = createPortfolioScene(container, canvas, tooltip!, {
						onError: () => (sceneError = true),
						onFrame: syncScreen,
						onHoverChange: (value) => {
							hovered = value;
							if (value) lastTooltipTarget = value;
						},
						onFocusChange: updateFocus,
						onThemeChange: (value) => {
							darkMode = value;
							saveDarkMode(value);
						},
						initialDarkMode: darkMode,
						initialSoundEnabled: soundEnabled
					});
				}
			})
			.catch((error: unknown) => {
				if (!cancelled) {
					console.error('Could not start the 3D scene', error);
					sceneError = true;
				}
			});
		return () => {
			cancelled = true;
			clearTimeout(focusTimer);
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('message', onMessage);
			window.removeEventListener('keydown', onKeyDown);
			scene?.dispose();
		};
	});
</script>

<svelte:head>
	<title>Chris Louwerse | Software Developer</title>
	<meta
		name="description"
		content="Explore Chris Louwerse's interactive software development portfolio."
	/>
</svelte:head>

<main
	class={`relative h-screen min-h-[400px] overflow-hidden transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}
>
	<div bind:this={container} class="absolute inset-0">
		<canvas
			bind:this={canvas}
			class="block h-full w-full touch-none"
			aria-label="Interactive 3D desk with a laptop and a lamp that changes the color mode"
		></canvas>
	</div>
	<HeroHeader {darkMode} {focused} {language} />
	<SceneTooltip
		bind:element={tooltip}
		{hovered}
		lastTarget={lastTooltipTarget}
		{darkMode}
		{focused}
		{language}
	/>
	<SceneControls
		{darkMode}
		{soundEnabled}
		{language}
		onToggleTheme={toggleTheme}
		onToggleSound={toggleSound}
		onToggleLanguage={toggleLanguage}
	/>
	<SceneObjectControls
		{darkMode}
		{focused}
		{language}
		onToggleLaptop={() => (focused ? scene?.exitFocus() : scene?.enterFocus())}
	/>
	{#if focused && closeupReady}
		<div class="pointer-events-none fixed inset-0 z-30">
			<iframe
				bind:this={laptopScreen}
				src={`${resolve('/desktop')}?closed=1&embedded=1`}
				title="Laptop desktop"
				class="laptop-screen pointer-events-auto absolute top-0 left-0 border-0"
				style={`width:${LAPTOP_SCREEN.width}px;height:${LAPTOP_SCREEN.height}px;transform-origin:top left;`}
			></iframe>
		</div>
	{/if}
	{#if sceneError}
		<div
			class="absolute right-4 bottom-4 left-4 z-10 max-w-md rounded-xl bg-[#10213c] p-4 text-sm text-white shadow-xl"
		>
			<p>{t.sceneError}</p>
			<a href={resolve('/desktop')} class="mt-2 inline-block font-semibold text-blue-200 underline"
				>{t.openPortfolioPage}</a
			>
		</div>
	{/if}
</main>
