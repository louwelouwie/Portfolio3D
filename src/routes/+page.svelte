<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import cvUrl from '#lib/assets/ChrisLouwerseCV.pdf?url';
	import type {
		HoverTarget,
		FocusTarget,
		PortfolioScene,
		ScreenTarget
	} from '#lib/scene/createPortfolioScene.js';
	import { projectElementToQuad } from '#lib/scene/projectElementToQuad.js';
	import { CARD_MESH_NAMES, DEVICE_SCREENS, type CardMeshName } from '#lib/scene/deviceScreens.js';
	import { isDarkInNetherlands, readSessionTheme, saveSessionTheme } from '#lib/theme.js';
	import HeroHeader from '#lib/components/HeroHeader.svelte';
	import SceneTooltip from '#lib/components/SceneTooltip.svelte';
	import SceneControls from '#lib/components/SceneControls.svelte';
	import SceneObjectControls from '#lib/components/SceneObjectControls.svelte';
	import ContactCard from '#lib/components/ContactCard.svelte';
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
	let focused = $state<FocusTarget | null>(null);
	let closeupReady = $state(false);
	let screenReady = $state<Record<ScreenTarget, boolean>>({
		laptop: false,
		phone: false,
		embedded: false
	});
	let preferredDevice = $state<'laptop' | 'phone'>('laptop');
	let darkMode = $state(false);
	let manualTheme = false;
	let soundEnabled = $state(false);
	let language = $state<Language>('en');
	let t = $derived(copy[language]);
	let laptopScreen = $state<HTMLIFrameElement>();
	let phoneScreen = $state<HTMLIFrameElement>();
	let embeddedScreen = $state<HTMLIFrameElement>();
	const screenTransforms = new WeakMap<HTMLIFrameElement, string>();
	let paperPreview = $state<HTMLIFrameElement>();
	let cardElements = $state<Partial<Record<CardMeshName, HTMLDivElement>>>({});
	let cardInForeground = $state(false);
	let screenLayerWidth = $state(0);
	let screenLayerHeight = $state(0);
	let foregroundMaskPath = $state('');

	function toggleTheme() {
		if (scene) scene.setDarkMode(!darkMode, { playSound: true, manual: true });
		else {
			darkMode = !darkMode;
			manualTheme = true;
			saveSessionTheme(darkMode ? 'dark' : 'light');
		}
	}

	function applyAutomaticTheme() {
		if (manualTheme) return;
		const next = isDarkInNetherlands();
		if (scene) scene.setDarkMode(next);
		else darkMode = next;
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

	function updateFocus(value: FocusTarget | null) {
		focused = value;
		closeupReady = false;
	}

	function syncScreen(target: ScreenTarget, iframe: HTMLIFrameElement | undefined) {
		if (!iframe || !scene) return;
		const quad = scene.getScreenQuad(target);
		if (!quad) return;
		const { width, height } = DEVICE_SCREENS[target];
		const transform = projectElementToQuad(quad, width, height);
		if (screenTransforms.get(iframe) !== transform) {
			iframe.style.transform = transform;
			screenTransforms.set(iframe, transform);
		}
		screenReady[target] = true;
	}

	function syncSurfaces() {
		syncScreen('laptop', laptopScreen);
		syncScreen('phone', phoneScreen);
		syncScreen('embedded', embeddedScreen);
		for (const name of CARD_MESH_NAMES) {
			const element = cardElements[name];
			if (!element) continue;
			const projection = scene?.getCardProjection(name);
			if (name === 'Card') cardInForeground = projection?.foreground ?? false;
			const width = element.offsetWidth;
			if (!projection || !width) {
				element.style.visibility = 'hidden';
				continue;
			}
			const height = width / projection.aspect;
			element.style.height = `${height}px`;
			element.style.visibility = 'visible';
			element.style.transform = projectElementToQuad(projection.quad, width, height);
		}
		if (paperPreview) {
			const projection = closeupReady && scene?.getPaperProjection();
			paperPreview.style.visibility = projection ? 'visible' : 'hidden';
			if (projection) {
				const width = paperPreview.offsetWidth;
				const height = width / projection.aspect;
				paperPreview.style.height = `${height}px`;
				paperPreview.style.transform = projectElementToQuad(projection.quad, width, height);
			}
		}
		foregroundMaskPath = scene?.getForegroundMaskPath() ?? '';
	}

	onMount(() => {
		let cancelled = false;
		const viewport = matchMedia('(max-width: 639px)');
		const updatePreferredDevice = () => (preferredDevice = viewport.matches ? 'phone' : 'laptop');
		updatePreferredDevice();
		viewport.addEventListener('change', updatePreferredDevice);
		const savedTheme = readSessionTheme();
		manualTheme = savedTheme !== null;
		darkMode = savedTheme ? savedTheme === 'dark' : isDarkInNetherlands();
		soundEnabled = readSoundEnabled();
		language = readLanguage();
		const onStorage = (event: StorageEvent) => {
			if (event.key === soundStorageKey) {
				soundEnabled = event.newValue === 'true';
				scene?.setSoundEnabled(soundEnabled);
			}
			if (event.key === languageStorageKey) language = event.newValue === 'nl' ? 'nl' : 'en';
		};
		const onMessage = (event: MessageEvent) => {
			if (event.origin !== location.origin) return;
			if (
				event.data?.type === 'portfolio-exit' &&
				[laptopScreen, phoneScreen, embeddedScreen].some(
					(iframe) => event.source === iframe?.contentWindow
				)
			)
				scene?.exitFocus();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && focused) scene?.exitFocus();
		};
		window.addEventListener('storage', onStorage);
		window.addEventListener('message', onMessage);
		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('focus', applyAutomaticTheme);
		document.addEventListener('visibilitychange', applyAutomaticTheme);
		const themeTimer = setInterval(applyAutomaticTheme, 60_000);
		import('#lib/scene/createPortfolioScene.js')
			.then(({ createPortfolioScene }) => {
				if (!cancelled) {
					scene = createPortfolioScene(container, canvas, tooltip!, {
						onError: () => (sceneError = true),
						onFrame: syncSurfaces,
						onHoverChange: (value) => {
							hovered = value;
							if (value) lastTooltipTarget = value;
						},
						onFocusChange: updateFocus,
						onFocusReady: () => (closeupReady = true),
						onThemeChange: (value, manual) => {
							darkMode = value;
							if (manual) {
								manualTheme = true;
								saveSessionTheme(value ? 'dark' : 'light');
							}
						},
						onSoundChange: (value) => {
							soundEnabled = value;
							saveSoundEnabled(value);
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
			clearInterval(themeTimer);
			viewport.removeEventListener('change', updatePreferredDevice);
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('message', onMessage);
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener('focus', applyAutomaticTheme);
			document.removeEventListener('visibilitychange', applyAutomaticTheme);
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
			aria-label="Interactive 3D desk with a laptop, phone, embedded display, lamp, and printer"
		></canvas>
	</div>
	<HeroHeader {darkMode} focused={focused !== null} {language} />
	<SceneTooltip
		bind:element={tooltip}
		{hovered}
		lastTarget={lastTooltipTarget}
		{darkMode}
		{soundEnabled}
		focused={focused !== null}
		{language}
	/>
	<SceneControls
		{darkMode}
		{soundEnabled}
		{hovered}
		focused={focused !== null}
		{language}
		onToggleTheme={toggleTheme}
		onToggleSound={toggleSound}
		onToggleLanguage={toggleLanguage}
	/>
	<SceneObjectControls
		{darkMode}
		{focused}
		{hovered}
		{preferredDevice}
		{language}
		onTogglePortfolio={() => (focused ? scene?.exitFocus() : scene?.enterFocus(preferredDevice))}
	/>
	{#each CARD_MESH_NAMES as name (name)}
		{@const interactive = name === 'Card' && focused === 'card' && closeupReady}
		{@const inForeground = name === 'Card' && cardInForeground}
		<div
			class={`pointer-events-none fixed inset-0 ${inForeground ? 'z-30' : 'z-[4]'}`}
			style:mask-image={!inForeground && foregroundMaskPath
				? 'url(#foreground-object-mask)'
				: undefined}
		>
			<div
				bind:this={cardElements[name]}
				class={`pointer-events-none invisible absolute top-0 left-0 w-[450px] origin-top-left overflow-hidden ${interactive ? '[&_a]:pointer-events-auto' : ''}`}
				data-card-face={name}
			>
				<ContactCard {interactive} />
			</div>
		</div>
	{/each}
	{#if focused === 'printer'}
		<iframe
			bind:this={paperPreview}
			src={`${cvUrl}#toolbar=0&navpanes=0&view=Fit`}
			title={t.cvPreview}
			class="invisible fixed top-0 left-0 z-30 w-[800px] origin-top-left border-0 bg-white"
		></iframe>
		{#if closeupReady}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={cvUrl}
				download="ChrisLouwerseCV.pdf"
				class="fixed top-4 right-4 z-50 flex h-11 items-center rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-[#10223d] shadow-lg hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700"
				>{t.downloadCv}</a
			>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	{/if}
	<svg aria-hidden="true" class="pointer-events-none fixed h-0 w-0">
		<defs>
			<mask id="foreground-object-mask" x="0" y="0" width="1" height="1">
				<rect width={screenLayerWidth} height={screenLayerHeight} fill="white" />
				<path d={foregroundMaskPath} fill="black" />
			</mask>
		</defs>
	</svg>
	<div
		bind:clientWidth={screenLayerWidth}
		bind:clientHeight={screenLayerHeight}
		class="pointer-events-none fixed inset-0 z-[5]"
		style:mask-image={foregroundMaskPath ? 'url(#foreground-object-mask)' : undefined}
	>
		<!-- The iframe becomes an interactive desktop in laptop focus. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<iframe
			bind:this={laptopScreen}
			src={`${resolve('/desktop')}?closed=1&embedded=1`}
			title="Laptop desktop"
			aria-hidden={focused !== 'laptop'}
			tabindex={focused === 'laptop' && closeupReady ? undefined : -1}
			class={`laptop-screen absolute top-0 left-0 border-0 transition-opacity duration-500 motion-reduce:transition-none ${screenReady.laptop ? 'visible' : 'invisible'} ${focused && focused !== 'laptop' ? 'opacity-0' : 'opacity-100'} ${focused === 'laptop' && closeupReady ? 'pointer-events-auto' : 'pointer-events-none'}`}
			style={`width:${DEVICE_SCREENS.laptop.width}px;height:${DEVICE_SCREENS.laptop.height}px;transform-origin:top left;`}
		></iframe>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<iframe
			bind:this={phoneScreen}
			src={`${resolve('/phone')}?embedded=1`}
			title="Phone portfolio"
			aria-hidden={focused !== 'phone'}
			tabindex={focused === 'phone' && closeupReady ? undefined : -1}
			class={`absolute top-0 left-0 border-0 transition-opacity duration-500 motion-reduce:transition-none ${screenReady.phone ? 'visible' : 'invisible'} ${focused && focused !== 'phone' ? 'opacity-0' : 'opacity-100'} ${focused === 'phone' && closeupReady ? 'pointer-events-auto' : 'pointer-events-none'}`}
			style={`width:${DEVICE_SCREENS.phone.width}px;height:${DEVICE_SCREENS.phone.height}px;transform-origin:top left;`}
		></iframe>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<iframe
			bind:this={embeddedScreen}
			src={`${resolve('/game')}?embedded=1`}
			title={t.embeddedZoom}
			aria-hidden={focused !== 'embedded'}
			tabindex={focused === 'embedded' && closeupReady ? undefined : -1}
			class={`absolute top-0 left-0 border-0 transition-opacity duration-500 motion-reduce:transition-none ${screenReady.embedded ? 'visible' : 'invisible'} ${focused && focused !== 'embedded' ? 'opacity-0' : 'opacity-100'} ${focused === 'embedded' && closeupReady ? 'pointer-events-auto' : 'pointer-events-none'}`}
			style={`width:${DEVICE_SCREENS.embedded.width}px;height:${DEVICE_SCREENS.embedded.height}px;transform-origin:top left;`}
		></iframe>
	</div>
	{#if sceneError}
		<div
			class="absolute right-4 bottom-4 left-4 z-10 max-w-md rounded-xl bg-[#10213c] p-4 text-sm text-white shadow-xl"
		>
			<p>{t.sceneError}</p>
			<a
				href={preferredDevice === 'phone' ? resolve('/phone') : resolve('/desktop')}
				class="mt-2 inline-block font-semibold text-blue-200 underline">{t.openPortfolioPage}</a
			>
		</div>
	{/if}
</main>
