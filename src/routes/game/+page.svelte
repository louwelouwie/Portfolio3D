<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import RunnerGame from '#lib/components/RunnerGame.svelte';
	import { copy, languageStorageKey, readLanguage, type Language } from '#lib/language.js';

	const embedded = page.url.searchParams.has('embedded');
	let language = $state<Language>('en');
	let t = $derived(copy[language]);
	const backToDesk = () => {
		if (embedded) window.parent.postMessage({ type: 'portfolio-exit' }, location.origin);
		else void goto(resolve('/'));
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

<main
	class={`flex min-h-screen flex-col bg-[#e7f0ff] ${embedded ? 'h-screen overflow-hidden px-2 py-2' : 'px-4 py-5 sm:px-8'}`}
>
	{#if !embedded}
		<button
			type="button"
			onclick={backToDesk}
			class="self-start rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-[#10223d] shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
			>← {t.backToDesk}</button
		>
	{/if}
	<div class={`flex flex-1 items-center justify-center ${embedded ? 'min-h-0 py-2' : 'py-8'}`}>
		<RunnerGame {language} compact={embedded} />
	</div>
</main>
