<script lang="ts">
	import { copy, type Language } from '#lib/language.js';
	let { language }: { language: Language } = $props();
	const skills = ['SvelteKit', 'TypeScript', 'Three.js', 'Tailwind CSS'];
</script>

<h1 class="text-3xl font-bold text-blue-800">{copy[language].skillsHeading}</h1>
<ul class="mt-5 flex flex-wrap gap-3">
	{#each skills as skill (skill)}
		<li class="rounded-full bg-blue-100 px-4 py-2 font-semibold text-blue-900">{skill}</li>
	{/each}
</ul>
