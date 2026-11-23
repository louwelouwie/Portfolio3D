<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import PortfolioContent from '#lib/components/PortfolioContent.svelte';
	import { copy, languageStorageKey, readLanguage, type Language } from '#lib/language.js';

	const embedded = page.url.searchParams.has('embedded');
	type PhoneView = 'home' | 'portfolio';
	let view = $state<PhoneView | 'history'>('home');
	let beforeHistory: PhoneView = 'home';
	let hasOpenedPortfolio = $state(false);
	let language = $state<Language>('en');
	let t = $derived(copy[language]);

	function openPortfolio() {
		hasOpenedPortfolio = true;
		view = 'portfolio';
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
			if (event.key === 'Escape' && embedded)
				window.parent.postMessage({ type: 'portfolio-exit' }, location.origin);
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

<main class="flex h-screen min-h-0 flex-col overflow-hidden bg-[#f3f8ff] text-[#10223d]">
	{#if !embedded}
		<a href={resolve('/')} class="px-6 py-3 text-sm font-semibold text-blue-800 underline"
			>{t.backToDesk}</a
		>
	{/if}
	{#if view === 'home'}
		<div class="flex min-h-0 flex-1 items-start bg-[#5b9df0] p-6">
			<button
				type="button"
				onclick={openPortfolio}
				class="flex cursor-pointer flex-col items-center gap-2 rounded-xl p-2 text-sm font-semibold hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-blue-900"
			>
				<span
					aria-hidden="true"
					class="grid size-14 place-items-center rounded-xl bg-white text-2xl font-bold text-blue-700 shadow"
					>P</span
				>
				{t.portfolio}
			</button>
		</div>
	{:else if view === 'history'}
		<section class="min-h-0 flex-1 overflow-y-auto bg-[#e7f0ff] p-6" aria-label={t.phoneHistory}>
			<h1 class="text-xl font-bold">{t.phoneHistory}</h1>
			{#if hasOpenedPortfolio}
				<button
					type="button"
					onclick={openPortfolio}
					class="mt-4 w-full cursor-pointer rounded-xl border border-blue-200 bg-white p-4 text-left font-semibold hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-700"
					>{t.portfolio}</button
				>
			{:else}
				<p class="mt-4 text-sm">{t.phoneNoHistory}</p>
			{/if}
		</section>
	{/if}
	{#if hasOpenedPortfolio}
		<div class={view === 'portfolio' ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
			<PortfolioContent darkMode={false} {language} />
		</div>
	{/if}
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
