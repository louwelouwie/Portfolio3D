<script lang="ts">
	import { copy, type Language } from '#lib/language.js';
	import { skillGroups } from '#lib/portfolio/content.js';
	let { language }: { language: Language } = $props();
</script>

<h1 class="text-4xl font-extrabold tracking-tight">{copy[language].skills}</h1>

<div class="mt-6 grid gap-4">
	{#each skillGroups as group (group.title.en)}
		<section class="rounded-2xl border border-blue-100 bg-white p-4 sm:p-6">
			<h2 class="text-xl font-bold">{group.title[language]}</h2>
			<p class="mt-2 leading-relaxed text-slate-700">{group.description[language]}</p>
			<ul class="mt-4 flex flex-wrap gap-2">
				{#each group.skills as skill (skill)}
					<li class="rounded-md bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-900">
						{skill}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
