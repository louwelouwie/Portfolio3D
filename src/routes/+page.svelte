<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import type { HoverTarget, PortfolioScene } from '#lib/scene/createPortfolioScene.js';
	import { readDarkMode, saveDarkMode, themeStorageKey } from '#lib/theme.js';

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let tooltip: HTMLDivElement;
	let scene: PortfolioScene | undefined;
	let sceneError = $state(false);
	let hovered = $state<HoverTarget>(null);
	let focused = $state(false);
	let darkMode = $state(true);
	let portalVisible = $state(false);
	let portalExpanded = $state(false);
	let portalReady = $state(false);
	let portalRect = $state({ left: 0, top: 0, width: 0, height: 0 });
	let portalTimer: ReturnType<typeof setTimeout> | undefined;
	let portalFrame = 0;

	function updateFocus(value: boolean) {
		focused = value;
		const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 950;
		clearTimeout(portalTimer);
		cancelAnimationFrame(portalFrame);
		if (value) {
			portalRect = scene?.getScreenRect() ?? {
				left: innerWidth * 0.4,
				top: innerHeight * 0.4,
				width: innerWidth * 0.2,
				height: innerHeight * 0.2
			};
			portalVisible = true;
			portalExpanded = false;
			portalReady = false;
			portalFrame = requestAnimationFrame(() => {
				portalFrame = requestAnimationFrame(() => {
					portalExpanded = true;
					portalTimer = setTimeout(() => (portalReady = true), duration);
				});
			});
		} else if (portalVisible) {
			portalReady = false;
			portalExpanded = false;
			portalTimer = setTimeout(() => (portalVisible = false), duration);
		}
	}

	onMount(() => {
		let cancelled = false;
		darkMode = readDarkMode();
		const onStorage = (event: StorageEvent) => {
			if (event.key !== themeStorageKey) return;
			darkMode = event.newValue !== 'light';
			scene?.setDarkMode(darkMode);
		};
		const onMessage = (event: MessageEvent) => {
			if (event.origin === location.origin && event.data?.type === 'portfolio-exit') {
				scene?.exitFocus();
			}
		};
		window.addEventListener('storage', onStorage);
		window.addEventListener('message', onMessage);
		import('#lib/scene/createPortfolioScene.js')
			.then(({ createPortfolioScene }) => {
				if (!cancelled) {
					scene = createPortfolioScene(container, canvas, tooltip, {
						onError: () => (sceneError = true),
						onHoverChange: (value) => (hovered = value),
						onFocusChange: updateFocus,
						onThemeChange: (value) => {
							darkMode = value;
							saveDarkMode(value);
						},
						initialDarkMode: darkMode
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
			clearTimeout(portalTimer);
			cancelAnimationFrame(portalFrame);
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('message', onMessage);
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
	class={`relative h-screen min-h-[400px] overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-[#1b202b] text-white' : 'bg-[#e8ecf1] text-slate-900'}`}
>
	<div bind:this={container} class="absolute inset-0">
		<canvas
			bind:this={canvas}
			class="block h-full w-full touch-none"
			aria-label="Interactive 3D desk with a laptop and a lamp that changes the color mode"
		></canvas>
	</div>
	<div
		class={`pointer-events-none absolute top-6 left-6 z-10 max-w-xl transition-all duration-500 ease-out sm:top-12 sm:left-12 ${focused ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}
	>
		<h1 class="text-5xl leading-tight font-bold tracking-tight sm:text-7xl">
			Chris <span class="text-blue-400">Louwerse</span>
		</h1>
		<p class={`mt-3 text-xl sm:text-2xl ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
			I build software and interactive web experiences.
		</p>
		<p
			class={`mt-5 max-w-sm text-sm sm:text-base ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
		>
			This is where I share projects, experiments, and what I learn along the way.
		</p>
	</div>
	<div
		bind:this={tooltip}
		class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
		aria-hidden={hovered === null || focused}
	>
		<div
			class={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap shadow-lg transition-all duration-300 ease-out ${darkMode ? 'bg-slate-950/90 text-white' : 'bg-white/95 text-slate-900'} ${hovered && !focused ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
		>
			{hovered === 'lamp'
				? darkMode
					? 'Click lamp for light mode'
					: 'Click lamp for dark mode'
				: 'Click laptop to zoom in'}
		</div>
	</div>
	<a
		href={resolve('/desktop')}
		class={`absolute right-4 bottom-4 z-10 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold transition-opacity duration-300 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-white sm:right-6 sm:bottom-6 ${focused ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
		onclick={(event) => {
			if (scene && !sceneError) {
				event.preventDefault();
				scene.enterFocus();
			}
		}}
		tabindex={focused ? -1 : 0}
		aria-hidden={focused}>Open portfolio directly</a
	>
	{#if portalVisible}
		<div
			class={`portfolio-portal fixed z-40 overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-blue-400'} ${portalExpanded ? 'rounded-none' : 'rounded-sm'}`}
			style={`left:${portalExpanded ? '0' : `${portalRect.left}px`};top:${portalExpanded ? '0' : `${portalRect.top}px`};width:${portalExpanded ? '100vw' : `${portalRect.width}px`};height:${portalExpanded ? '100vh' : `${portalRect.height}px`};`}
		>
			<iframe
				src={`${resolve('/desktop')}?closed=1&embedded=1`}
				title="Interactive portfolio desktop"
				class={`h-full w-full border-0 transition-opacity duration-300 ${portalReady ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
			></iframe>
			{#if portalReady}
				<button
					type="button"
					class="absolute top-2 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-950/85 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-950 focus-visible:outline-2 focus-visible:outline-white"
					onclick={() => scene?.exitFocus()}
					>Back to desk <span aria-hidden="true">Esc</span></button
				>
			{/if}
		</div>
	{/if}
	{#if sceneError}
		<p class="absolute top-20 right-4 left-4 z-10 max-w-md rounded-lg bg-black/80 p-4 text-sm">
			The 3D scene could not load. You can still open the portfolio using the link below.
		</p>
	{/if}
</main>

<style>
	.portfolio-portal {
		transition:
			left 950ms cubic-bezier(0.65, 0, 0.35, 1),
			top 950ms cubic-bezier(0.65, 0, 0.35, 1),
			width 950ms cubic-bezier(0.65, 0, 0.35, 1),
			height 950ms cubic-bezier(0.65, 0, 0.35, 1),
			border-radius 950ms ease;
	}
	@media (prefers-reduced-motion: reduce) {
		.portfolio-portal {
			transition-duration: 0ms;
		}
	}
</style>
