<script lang="ts">
	import { copy, type Language } from '#lib/language.js';
	import { projectLinks } from '#lib/portfolio/launcher.js';
	let { language }: { language: Language } = $props();
	let t = $derived(copy[language]);
</script>

<h1 class="text-3xl font-bold text-blue-800">{t.projects}</h1>
<article class="mt-5 max-w-xl rounded-xl border border-blue-100 bg-white p-6">
	<h2 class="text-2xl font-bold">{t.projectTitle}</h2>
	<p class="mt-3 leading-relaxed">{t.projectBody}</p>
</article>
<ul class="mt-3 grid max-w-xl gap-3">
	{#each [{ name: 'Artisan Bouwservice', href: projectLinks.artisanBouwservice }, { name: 'Monkey Empires', href: projectLinks.monkeyEmpires }] as { name, href } (name)}
		<li class="rounded-xl border border-blue-100 bg-white p-4">
			{#if href}
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					{href}
					target="_blank"
					rel="noopener noreferrer"
					class="font-semibold text-blue-800 underline underline-offset-2 focus-visible:outline-2"
					>{name}</a
				>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{:else}
				<span class="font-semibold">{name}</span>
				<small class="ml-2 text-slate-600">{t.shortcutUnavailable}</small>
			{/if}
		</li>
	{/each}
</ul>
