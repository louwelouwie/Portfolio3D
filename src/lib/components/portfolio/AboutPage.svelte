<script lang="ts">
	import { copy, type Language } from '#lib/language.js';
	let { language }: { language: Language } = $props();
	let t = $derived(copy[language]);
</script>

<h1 class="text-4xl font-extrabold tracking-tight">
	Chris <span class="text-blue-700">Louwerse</span>
</h1>
<p class="mt-2 text-lg font-semibold">{t.role}</p>
<p class="mt-6 max-w-3xl text-lg leading-relaxed">{t.aboutBody}</p>
