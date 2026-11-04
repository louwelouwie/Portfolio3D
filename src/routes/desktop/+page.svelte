<script lang="ts">
	import PortfolioWindow from '#lib/components/PortfolioWindow.svelte';
	import { asset, resolve } from '$app/paths';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { readDarkMode, saveDarkMode, themeStorageKey } from '#lib/theme.js';

	const embedded = page.url.searchParams.has('embedded');
	let windowOpen = $state(!page.url.searchParams.has('closed'));
	let minimized = $state(false);
	let darkMode = $state(true);
	let leaving = $state(false);
	onMount(() => {
		darkMode = readDarkMode();
		const onStorage = (event: StorageEvent) => {
			if (event.key === themeStorageKey) darkMode = event.newValue !== 'light';
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
	const toggleTheme = () => {
		darkMode = !darkMode;
		saveDarkMode(darkMode);
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

<div
	aria-hidden="true"
	class={`fixed inset-0 transition-colors duration-500 ${darkMode ? 'bg-[#1b202b]' : 'bg-[#e8ecf1]'}`}
></div>
<main
	class={`desktop-view relative h-screen min-h-[400px] overflow-hidden text-white transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-blue-400'} ${leaving ? 'desktop-exit' : ''}`}
>
	<h1 class="sr-only">Chris Louwerse portfolio desktop</h1>
	{#if !embedded}
		<button
			type="button"
			class="absolute top-2 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-950/85 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-slate-950 focus-visible:outline-2 focus-visible:outline-white"
			onclick={exitToDesk}>Back to desk <span aria-hidden="true">Esc</span></button
		>
	{/if}
	<div class="grid w-fit grid-cols-2 gap-5 p-6 text-center sm:grid-cols-3">
		<figure class="flex w-24 flex-col items-center gap-2">
			<img src={asset('bin.png')} alt="" class="h-14 w-14 rounded-xl" />
			<figcaption class="text-sm font-semibold">Prullenbak</figcaption>
		</figure>
		<figure class="flex w-24 flex-col items-center gap-2">
			<img src={asset('game.png')} alt="" class="h-14 w-14 rounded-xl bg-white" />
			<figcaption class="text-sm font-semibold">Game</figcaption>
		</figure>
		<button
			type="button"
			onclick={openPortfolio}
			class="flex w-24 cursor-pointer flex-col items-center gap-2 rounded-xl p-1 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
		>
			<span
				aria-hidden="true"
				class="flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-900 text-3xl font-bold text-blue-400"
				>P</span
			>
			<span class="text-sm font-semibold">Portfolio</span>
		</button>
	</div>

	{#if windowOpen && !minimized}
		<PortfolioWindow
			{darkMode}
			onClose={() => (windowOpen = false)}
			onMinimize={() => (minimized = true)}
		/>
	{/if}

	<footer
		class={`absolute right-0 bottom-0 left-0 z-50 flex h-12 items-center gap-3 px-4 shadow-lg transition-colors duration-500 ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
	>
		<button
			type="button"
			onclick={() => (windowOpen && !minimized ? (minimized = true) : openPortfolio())}
			class={`cursor-pointer rounded-lg px-3 py-1 font-semibold focus-visible:outline-2 focus-visible:outline-blue-600 ${darkMode ? 'hover:bg-white/15' : 'hover:bg-neutral-100'}`}
			aria-label={windowOpen && !minimized ? 'Minimize portfolio' : 'Open portfolio'}
			>Portfolio</button
		>
		<button
			type="button"
			onclick={toggleTheme}
			class={`ml-auto cursor-pointer rounded-lg px-3 py-1 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-600 ${darkMode ? 'hover:bg-white/15' : 'hover:bg-neutral-100'}`}
			>{darkMode ? 'Light mode' : 'Dark mode'}</button
		>
		<span class="text-sm">Chris Louwerse</span>
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
