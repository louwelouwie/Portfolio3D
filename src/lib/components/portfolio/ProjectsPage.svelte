<script lang="ts">
	import { copy, type Language } from '#lib/language.js';
	import { projects } from '#lib/portfolio/content.js';
	import { projectLinks } from '#lib/portfolio/launcher.js';
	let { language }: { language: Language } = $props();
	let t = $derived(copy[language]);
</script>

<h1 class="text-4xl font-extrabold tracking-tight">{t.projects}</h1>
<div class="mt-6 grid gap-4 lg:grid-cols-3">
	{#each projects as project (project.id)}
		{@const href = project.id === 'portfolio' ? undefined : projectLinks[project.id]}
		<article class="flex flex-col rounded-2xl border border-blue-100 bg-white p-4 sm:p-6">
			<h2 class="text-xl font-bold">{project.title}</h2>
			<p class="mt-3 leading-relaxed text-slate-700">{project.description[language]}</p>
			<div class="mt-auto pt-4">
				<ul class="flex flex-wrap gap-2">
					{#each project.tools as tool (tool)}
						<li class="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900">
							{tool}
						</li>
					{/each}
				</ul>
				{#if href}
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						{href}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`${t.viewProject} ${project.title}`}
						class="mt-5 inline-flex text-sm font-semibold text-blue-800 underline underline-offset-4 focus-visible:outline-2"
					>
						{t.viewProject}
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
			</div>
		</article>
	{/each}
</div>
