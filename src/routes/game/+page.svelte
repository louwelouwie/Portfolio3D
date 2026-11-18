<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import RunnerGame from '#lib/components/RunnerGame.svelte';
	import { copy, languageStorageKey, readLanguage, type Language } from '#lib/language.js';

	const embedded = page.url.searchParams.has('embedded');
	const desktopHref = `${resolve('/desktop')}?closed=1${embedded ? '&embedded=1' : ''}`;
	let language = $state<Language>('en');
	let t = $derived(copy[language]);
	const backToDesktop = () => {
		// The pathname is resolved before adding the desktop state query.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		void goto(desktopHref);
	};

	onMount(() => {
		language = readLanguage();
		const onStorage = (event: StorageEvent) => {
			if (event.key === languageStorageKey) language = event.newValue === 'nl' ? 'nl' : 'en';
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	});
</script>

<svelte:head>
	<title>{t.runnerTitle} | Chris Louwerse</title>
	<meta name="description" content="Play a small dinosaur runner in Chris Louwerse's portfolio." />
</svelte:head>

<main class="flex min-h-screen flex-col bg-[#e7f0ff] px-4 py-5 sm:px-8">
	<button
		type="button"
		onclick={backToDesktop}
		class="self-start rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-[#10223d] shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
		>← {t.backToDesktop}</button
	>
	<div class="flex flex-1 items-center justify-center py-8">
		<RunnerGame {language} />
	</div>
</main>
