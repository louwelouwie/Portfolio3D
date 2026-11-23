<script lang="ts">
	import { copy, type Language } from '#lib/language.js';
	let { language }: { language: Language } = $props();
	let t = $derived(copy[language]);
</script>

<h1 class="text-3xl font-bold text-blue-800">{t.projects}</h1>
<article class="mt-5 max-w-xl rounded-xl border border-blue-100 bg-white p-6">
	<h2 class="text-2xl font-bold">{t.projectTitle}</h2>
	<p class="mt-3 leading-relaxed">{t.projectBody}</p>
</article>
