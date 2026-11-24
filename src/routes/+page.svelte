<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
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
	import { animateControlPress } from '#lib/components/animateControlPress.js';
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
	let scene = $state.raw<PortfolioScene>();
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
	let cardElements = $state<Partial<Record<CardMeshName, HTMLDivElement>>>({});
	let cardInForeground = $state(false);
	let screenLayerWidth = $state(0);
	let screenLayerHeight = $state(0);
	let foregroundMaskPath = $state('');
	let focusHistory: Promise<void> | undefined;
	let returningToDesk = false;
	let returnTimeout: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const target = page.state.deskFocus;
		const currentScene = scene;
		untrack(() => {
			if (returningToDesk) {
				if (!target) finishDeskReturn();
				return;
			}
			if (target) currentScene?.enterFocus(target);
			else currentScene?.exitFocus();
		});
	});

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

	function writeDeskHistory(target: FocusTarget | undefined, replace = false) {
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- Reuse the current base-aware URL.
		return goto(page.url.href, {
			shallow: true,
			replace,
			state: { ...page.state, deskFocus: target }
		}).catch((error: unknown) => console.error('Could not save desk focus in history', error));
	}

	function updateFocus(value: FocusTarget | null) {
		focused = value;
		closeupReady = false;
		if (value && !returningToDesk && page.state.deskFocus !== value)
			focusHistory = writeDeskHistory(value, Boolean(page.state.deskFocus));
	}

	function finishDeskReturn() {
		clearTimeout(returnTimeout);
		returnTimeout = undefined;
		returningToDesk = false;
		if (focused && page.state.deskFocus !== focused)
			focusHistory = writeDeskHistory(focused, Boolean(page.state.deskFocus));
	}

	async function exitToDesk() {
		if (!focused) return;
		if (returningToDesk) {
			scene?.exitFocus();
			return;
		}
		returningToDesk = true;
		scene?.exitFocus();
		// The scene can close even if the browser skips or delays this shallow entry.
		returnTimeout = setTimeout(() => {
			if (page.state.deskFocus) {
				void writeDeskHistory(undefined, true).then(() => {
					if (returningToDesk) finishDeskReturn();
				});
			} else finishDeskReturn();
		}, 450);
		await focusHistory;
		if (!returningToDesk) return;
		if (page.state.deskFocus) history.back();
		else finishDeskReturn();
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
				void exitToDesk();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.repeat || !focused) return;
			event.preventDefault();
			void exitToDesk();
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
			clearTimeout(returnTimeout);
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
	data-locked-viewport
	class={`fixed inset-0 overflow-clip transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}
>
	<div bind:this={container} class="absolute inset-0">
		<canvas
			bind:this={canvas}
			class="block h-full w-full touch-none select-none [-webkit-touch-callout:none]"
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
	<div
		class={`pointer-events-none absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex items-center justify-center gap-1.5 ${focused ? 'sm:inset-auto sm:top-4 sm:left-4' : ''}`}
	>
		<SceneObjectControls
			{darkMode}
			{focused}
			{hovered}
			{preferredDevice}
			{language}
			onTogglePortfolio={() => (focused ? void exitToDesk() : scene?.enterFocus(preferredDevice))}
		/>
		{#if focused === 'printer'}
			<div
				class="flex h-11 w-[8.25rem] shrink-0 justify-end sm:fixed sm:top-4 sm:right-4 sm:w-auto"
			>
				{#if closeupReady}
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href={cvUrl}
						use:animateControlPress
						download="ChrisLouwerseCV.pdf"
						class={`pointer-events-auto flex items-center justify-center gap-1 rounded-xl border px-2 text-sm font-semibold whitespace-nowrap shadow-lg transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 sm:gap-1.5 sm:px-3 ${darkMode ? 'border-blue-300/25 bg-[#10264a]/95 text-white hover:bg-[#1d3c69]' : 'border-blue-200 bg-white/95 text-[#10223d] hover:bg-blue-50'}`}
					>
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							class="size-4 shrink-0"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" />
						</svg>
						{t.downloadCv}
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
			</div>
		{:else}
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
		{/if}
	</div>
	{#if !focused}
		{#each [-1, 1] as const as direction (direction)}
			<button
				type="button"
				aria-label={direction === -1 ? t.panLeft : t.panRight}
				onclick={() => scene?.panOverview(direction)}
				class={`absolute top-1/2 z-20 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 sm:hidden ${direction === -1 ? 'left-2' : 'right-2'} ${darkMode ? 'border-blue-300/25 bg-[#10264a]/95 text-white' : 'border-blue-200 bg-white/95 text-[#10223d]'}`}
			>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					class="size-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d={direction === -1 ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
				</svg>
			</button>
		{/each}
	{/if}
	{#each CARD_MESH_NAMES as name (name)}
		{@const interactive = name === 'Card' && focused === 'card' && closeupReady}
		{@const inForeground = name === 'Card' && cardInForeground}
		<div
			class={`pointer-events-none absolute inset-0 ${inForeground ? 'z-30' : 'z-[4]'}`}
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
		class="pointer-events-none absolute inset-0 z-[5]"
		style:mask-image={foregroundMaskPath ? 'url(#foreground-object-mask)' : undefined}
	>
		<!-- The iframe becomes an interactive desktop in laptop focus. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<iframe
			bind:this={laptopScreen}
			src={`${resolve('/desktop')}?closed=1&embedded=1`}
			title="Laptop desktop"
			aria-hidden={focused !== 'laptop'}
			inert={focused !== 'laptop' || !closeupReady}
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
			inert={focused !== 'phone' || !closeupReady}
			tabindex={focused === 'phone' && closeupReady ? undefined : -1}
			class={`absolute top-0 left-0 rounded-[14px] border-0 transition-opacity duration-500 motion-reduce:transition-none ${screenReady.phone ? 'visible' : 'invisible'} ${focused && focused !== 'phone' ? 'opacity-0' : 'opacity-100'} ${focused === 'phone' && closeupReady ? 'pointer-events-auto' : 'pointer-events-none'}`}
			style={`width:${DEVICE_SCREENS.phone.width}px;height:${DEVICE_SCREENS.phone.height}px;transform-origin:top left;`}
		></iframe>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<iframe
			bind:this={embeddedScreen}
			src={`${resolve('/game')}?embedded=1`}
			title={t.embeddedZoom}
			aria-hidden={focused !== 'embedded'}
			inert={focused !== 'embedded' || !closeupReady}
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
