<script lang="ts">
	import cvUrl from '#lib/assets/ChrisLouwerseCV.pdf?url';
	import { copy, type Language } from '#lib/language.js';
	let { language }: { language: Language } = $props();
	let t = $derived(copy[language]);
</script>

<h1 class="text-4xl font-extrabold tracking-tight">
	Chris <span class="text-blue-700">Louwerse</span>
</h1>
<p class="mt-2 text-lg font-semibold">{t.role}</p>
<p class="mt-6 max-w-3xl text-lg leading-relaxed">{t.aboutBody}</p>
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	href={cvUrl}
	download="ChrisLouwerseCV.pdf"
	class="mt-6 inline-flex rounded-xl border border-blue-200 bg-white px-4 py-2 font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2"
>
	{t.downloadCv}
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
