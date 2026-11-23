<script lang="ts">
	import { contactLinks } from '#lib/contact.js';
	import { copy, type Language } from '#lib/language.js';
	let { language }: { language: Language } = $props();
</script>

<h1 class="text-3xl font-bold text-blue-800">{copy[language].contact}</h1>
<ul class="mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<li><a href={contactLinks.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
	<li><a href={contactLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
	<li><a href={contactLinks.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
	<li><a href={contactLinks.email}>Email</a></li>
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
