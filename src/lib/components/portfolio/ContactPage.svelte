<script lang="ts">
	import { contactDestination } from '#lib/contact.js';
	import { copy, type Language } from '#lib/language.js';
	let { language }: { language: Language } = $props();
	const t = $derived(copy[language]);
	const email = contactDestination('email');
	const profiles = [
		{ label: 'GitHub', href: contactDestination('github') },
		{ label: 'LinkedIn', href: contactDestination('linkedin') }
	];
</script>

<h1 class="text-4xl font-extrabold tracking-tight">{t.connectHeading}</h1>
<p class="mt-4 max-w-xl leading-relaxed text-slate-700">{t.connectBody}</p>

<div class="mt-6 flex flex-wrap items-center gap-3">
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	{#if email}
		<a
			href={email}
			class="inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
		>
			{t.emailMe}
		</a>
	{/if}
	{#each profiles as { label, href } (label)}
		{#if href}
			<a
				{href}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex min-h-11 items-center rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2"
			>
				{label}
			</a>
		{/if}
	{/each}
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</div>
