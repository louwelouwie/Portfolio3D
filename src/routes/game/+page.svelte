<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
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
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !event.repeat) backToDesk();
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
	<title>{t.embeddedZoom} | Chris Louwerse</title>
	<meta name="description" content="The embedded display in Chris Louwerse's portfolio." />
</svelte:head>

<main
	data-locked-viewport={embedded || undefined}
	class="flex min-h-dvh flex-col bg-[#101922] p-4 text-[#c4f5df]"
>
	{#if !embedded}
		<button
			type="button"
			onclick={backToDesk}
			class="self-start rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-[#10223d] shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
			>← {t.backToDesk}</button
		>
	{/if}
	<div class="grid flex-1 place-items-center">
		<p class="font-mono text-2xl font-semibold">Hello, world!</p>
	</div>
</main>
