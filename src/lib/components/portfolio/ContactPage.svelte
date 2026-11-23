<script lang="ts">
	import { contactDestination } from '#lib/contact.js';
	import { copy, type Language } from '#lib/language.js';
	let { language }: { language: Language } = $props();
	const t = $derived(copy[language]);
	const links = $derived([
		{ label: 'GitHub', href: contactDestination('github') },
		{ label: 'LinkedIn', href: contactDestination('linkedin') },
		{ label: 'WhatsApp', href: contactDestination('whatsapp') },
		{ label: t.emailShortcut, href: contactDestination('email') }
	]);
</script>

<h1 class="text-3xl font-bold text-blue-800">{t.contact}</h1>
<ul class="mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	{#each links as { label, href } (label)}
		<li>
			{#if href}
				<a
					{href}
					target={href.startsWith('mailto:') ? undefined : '_blank'}
					rel="noopener noreferrer"
				>
					{label}
				</a>
			{:else}
				<span
					class="block rounded-xl border border-blue-100 px-4 py-3 font-semibold text-slate-600"
				>
					{label} <small class="ml-1 font-normal">{t.shortcutUnavailable}</small>
				</span>
			{/if}
		</li>
	{/each}
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</ul>

<style>
	a {
		display: block;
		padding: 0.75rem 1rem;
		border: 1px solid #bfdbfe;
		border-radius: 0.75rem;
		background: white;
		font-weight: 600;
	}

	a:hover,
	a:focus-visible {
		background: #dbeafe;
	}
</style>
