<script lang="ts">
	import PortfolioWindow from '#lib/components/PortfolioWindow.svelte';
	import DesktopIcon from '#lib/components/DesktopIcon.svelte';
	import { asset, resolve } from '$app/paths';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		readWindowMaximized,
		saveWindowMaximized,
		windowModeKey
	} from '#lib/desktop/windowState.js';
	import {
		copy,
		languageStorageKey,
		readLanguage,
		saveLanguage,
		type Language
	} from '#lib/language.js';
	import { readIconPosition, type IconPosition } from '#lib/desktop/iconPosition.js';
	import { iconSize, placeIcon } from '#lib/desktop/iconLayout.js';

	const embedded = page.url.searchParams.has('embedded');
	// The laptop desktop has its own fixed light theme; the lamp changes only the outer scene.
	const darkMode = false;
	let language = $state<Language>('en');
	let t = $derived(copy[language]);
	let iconPositions = $state<Record<'bin' | 'game' | 'portfolio', IconPosition>>({
		bin: { x: 24, y: 24 },
		game: { x: 140, y: 24 },
		portfolio: { x: 256, y: 24 }
	});
	let windowOpen = $state(!page.url.searchParams.has('closed'));
	let minimized = $state(false);
	let windowMaximized = $state(true);
	let desktopReady = $state(false);
	let leaving = $state(false);
	onMount(() => {
		windowMaximized = readWindowMaximized();
		language = readLanguage();
		const occupied: (IconPosition & { width: number; height: number })[] = [];
		const next = { ...iconPositions };
		for (const id of ['bin', 'game', 'portfolio'] as const) {
			const position = placeIcon(readIconPosition(id) ?? iconPositions[id], occupied, {
				width: window.innerWidth,
				height: window.innerHeight - 48
			});
			next[id] = position;
			occupied.push({ ...position, width: iconSize, height: iconSize });
		}
		iconPositions = next;
		desktopReady = true;
		const onStorage = (event: StorageEvent) => {
			if (event.key === windowModeKey) windowMaximized = event.newValue !== 'false';
			if (event.key === languageStorageKey) language = event.newValue === 'nl' ? 'nl' : 'en';
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				if (embedded) window.parent.postMessage({ type: 'portfolio-exit' }, location.origin);
				else void exitToDesk();
			}
		};
		window.addEventListener('storage', onStorage);
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('keydown', onKeyDown);
		};
	});
	const openPortfolio = () => {
		windowOpen = true;
		minimized = false;
	};
	const openGame = () => {
		const gamePath = resolve('/game');
		// The pathname is resolved before adding the embedded-view query.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(`${gamePath}${embedded ? '?embedded=1' : ''}`);
	};
	const togglePortfolio = () => {
		if (windowOpen && !minimized) {
			windowOpen = false;
			minimized = false;
		} else openPortfolio();
	};
	const setWindowMaximized = (value: boolean) => {
		windowMaximized = value;
		saveWindowMaximized(value);
	};
	const toggleLanguage = () => {
		language = language === 'en' ? 'nl' : 'en';
		saveLanguage(language);
	};
	const exitToDesk = async () => {
		if (leaving) return;
		leaving = true;
		const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500;
		await new Promise((done) => setTimeout(done, duration));
		await goto(resolve('/'));
	};
</script>

<svelte:head>
	<title>Portfolio desktop | Chris Louwerse</title>
	<meta
		name="description"
		content="Explore Chris Louwerse's projects and software development skills."
	/>
</svelte:head>

<div aria-hidden="true" class="fixed inset-0 bg-[#e7f0ff]"></div>
<main
	class={`desktop-view relative h-screen min-h-[400px] overflow-hidden bg-[#5b9df0] text-white ${leaving ? 'desktop-exit' : ''}`}
>
	<h1 class="sr-only">Chris Louwerse portfolio desktop</h1>
	{#if !embedded}
		<button
			type="button"
			class="absolute top-2 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-950/85 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-950 focus-visible:outline-2 focus-visible:outline-white"
			onclick={exitToDesk}>{t.backToDesk} <span aria-hidden="true">Esc</span></button
		>
	{/if}
	{#if desktopReady}
		<div class="absolute inset-x-0 top-0 bottom-12">
			<DesktopIcon
				id="bin"
				label={t.trash}
				dragHint={t.dragHint}
				image={asset('bin.png')}
				{darkMode}
				startX={iconPositions.bin.x}
				startY={iconPositions.bin.y}
			/>
			<DesktopIcon
				id="game"
				label={t.game}
				dragHint={t.dragHint}
				image={asset('game.png')}
				{darkMode}
				startX={iconPositions.game.x}
				startY={iconPositions.game.y}
				onActivate={openGame}
			/>
			<DesktopIcon
				id="portfolio"
				label={t.portfolio}
				dragHint={t.dragHint}
				letter="P"
				{darkMode}
				startX={iconPositions.portfolio.x}
				startY={iconPositions.portfolio.y}
				onActivate={togglePortfolio}
			/>
		</div>
	{/if}

	{#if desktopReady && windowOpen && !minimized}
		<PortfolioWindow
			{darkMode}
			{language}
			maximized={windowMaximized}
			onMaximizedChange={setWindowMaximized}
			onClose={() => {
				windowOpen = false;
				minimized = false;
			}}
			onMinimize={() => (minimized = true)}
		/>
	{/if}

	<footer
		class="absolute right-0 bottom-0 left-0 z-50 flex h-12 items-center gap-3 border-t border-blue-100 bg-white px-4 text-[#10223d] shadow-lg"
	>
		<button
			type="button"
			onclick={togglePortfolio}
			class="cursor-pointer rounded-lg px-3 py-1 font-semibold hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
			aria-label={windowOpen && !minimized ? t.closePortfolio : t.openPortfolio}
			>{t.portfolio}</button
		>
		{#if !embedded}
			<button
				type="button"
				aria-label={t.changeLanguage}
				onclick={toggleLanguage}
				class="ml-auto rounded-lg px-3 py-1 text-sm font-semibold hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
				>EN / NL</button
			>
		{/if}
		<span class:ml-auto={embedded} class="text-sm">Chris Louwerse</span>
	</footer>
</main>

<style>
	.desktop-view {
		transform-origin: 50% 45%;
		transition:
			transform 500ms cubic-bezier(0.4, 0, 0.8, 0.2),
			opacity 500ms ease;
	}
	.desktop-exit {
		transform: scale(0.35);
		opacity: 0;
	}
	@media (prefers-reduced-motion: reduce) {
		.desktop-view {
			transition-duration: 0ms;
		}
	}
</style>
