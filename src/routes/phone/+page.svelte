<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import DesktopIcon from '#lib/components/DesktopIcon.svelte';
	import PortfolioApp from '#lib/components/portfolio/PortfolioApp.svelte';
	import { iconSize, placeIcon } from '#lib/desktop/iconLayout.js';
	import { readIconPosition } from '#lib/desktop/iconPosition.js';
	import type { PortfolioAppId } from '#lib/portfolio/apps.js';
	import { launcherItems } from '#lib/portfolio/launcher.js';
	import { copy, languageStorageKey, readLanguage, type Language } from '#lib/language.js';

	const embedded = page.url.searchParams.has('embedded');
	type PhoneView = 'home' | PortfolioAppId;
	let view = $state<PhoneView | 'history'>('home');
	let beforeHistory: PhoneView = 'home';
	let recentApps = $state<PortfolioAppId[]>([]);
	let language = $state<Language>('en');
	let t = $derived(copy[language]);
	let launcherWidth = $state(0);
	let launcherHeight = $state(0);
	const iconWidth = $derived(Math.floor(launcherWidth / 3));
	const icons = $derived(launcherItems(language).filter((item) => item.kind === 'app'));
	const iconHeight = $derived(
		Math.min(iconSize, Math.floor(launcherHeight / Math.ceil(icons.length / 3)))
	);
	const homeIcons = $derived.by(() => {
		if (view !== 'home' || !iconWidth || !iconHeight) return [];
		const bounds = { width: launcherWidth, height: launcherHeight };
		const occupied: { x: number; y: number; width: number; height: number }[] = [];
		return icons.map((item, index) => {
			const id = `phone-${item.id}`;
			const start = { x: (index % 3) * iconWidth, y: Math.floor(index / 3) * iconHeight };
			const position = placeIcon(
				readIconPosition(id) ?? start,
				occupied,
				bounds,
				iconWidth,
				iconHeight,
				0
			);
			occupied.push({ ...position, width: iconWidth, height: iconHeight });
			return { id, item, ...position };
		});
	});

	function openApp(app: PortfolioAppId) {
		recentApps = [app, ...recentApps.filter((recent) => recent !== app)];
		view = app;
	}

	function toggleHistory() {
		if (view === 'history') view = beforeHistory;
		else {
			beforeHistory = view;
			view = 'history';
		}
	}

	function goBack() {
		view = view === 'history' ? beforeHistory : 'home';
	}

	onMount(() => {
		language = readLanguage();
		const onStorage = (event: StorageEvent) => {
			if (event.key === languageStorageKey) language = event.newValue === 'nl' ? 'nl' : 'en';
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.repeat) return;
			if (embedded) window.parent.postMessage({ type: 'portfolio-exit' }, location.origin);
			else void goto(resolve('/'));
		};
		window.addEventListener('storage', onStorage);
		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

<svelte:head>
	<title>{t.portfolio} | Chris Louwerse</title>
	<meta name="description" content="Chris Louwerse's mobile portfolio." />
</svelte:head>

<main
	data-locked-viewport={embedded || undefined}
	class="flex h-dvh min-h-0 flex-col overflow-clip bg-[#f3f8ff] text-[#10223d]"
>
	{#if !embedded}
		<a href={resolve('/')} class="px-6 py-3 text-sm font-semibold text-blue-800 underline"
			>{t.backToDesk}</a
		>
	{/if}
	{#if view === 'home'}
		<div
			bind:clientWidth={launcherWidth}
			bind:clientHeight={launcherHeight}
			class="relative min-h-0 flex-1 overflow-hidden bg-[#5b9df0]"
		>
			{#each homeIcons as { id, item, x, y } (id)}
				<DesktopIcon
					{id}
					{item}
					dragHint={t.dragHint}
					unavailableHint={t.shortcutUnavailable}
					darkMode={false}
					startX={x}
					startY={y}
					width={iconWidth}
					height={iconHeight}
					gap={0}
					onOpenApp={openApp}
				/>
			{/each}
		</div>
	{:else if view === 'history'}
		<section
			class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#e7f0ff] p-6"
			aria-label={t.phoneHistory}
		>
			<h1 class="text-xl font-bold">{t.phoneHistory}</h1>
			{#each recentApps as app (app)}
				<button
					type="button"
					onclick={() => openApp(app)}
					class="mt-4 w-full cursor-pointer rounded-xl border border-blue-200 bg-white p-4 text-left font-semibold hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700"
					>{t[app]}</button
				>
			{:else}
				<p class="mt-4 text-sm">{t.phoneNoHistory}</p>
			{/each}
		</section>
	{/if}
	{#each recentApps as app (app)}
		<div class={view === app ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
			<PortfolioApp {app} {language} />
		</div>
	{/each}
	<nav
		class="grid h-14 shrink-0 grid-cols-3 items-center border-t border-blue-100 bg-white"
		aria-label={t.phoneNavigation}
	>
		<button
			type="button"
			aria-label={t.phoneHistory}
			aria-pressed={view === 'history'}
			onclick={toggleHistory}
			class="grid h-full cursor-pointer place-items-center hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700"
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-6"
				fill="none"
				stroke="currentColor"
				stroke-width="2"><path d="M5 7h14M5 12h14M5 17h14" /></svg
			>
		</button>
		<button
			type="button"
			aria-label={t.phoneHome}
			onclick={() => (view = 'home')}
			class="grid h-full cursor-pointer place-items-center hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700"
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-6"
				fill="none"
				stroke="currentColor"
				stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="1" /></svg
			>
		</button>
		<button
			type="button"
			aria-label={t.phoneBack}
			onclick={goBack}
			class="grid h-full cursor-pointer place-items-center hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700"
		>
			<svg
				aria-hidden="true"
				viewBox="0 0 24 24"
				class="size-6"
				fill="none"
				stroke="currentColor"
				stroke-width="2"><path d="M7 12l10-6v12z" stroke-linejoin="round" /></svg
			>
		</button>
	</nav>
</main>
