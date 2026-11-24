<script lang="ts">
	import cvUrl from '#lib/assets/ChrisLouwerseCV.pdf?url';
	import { copy, type Language } from '#lib/language.js';
	import { education, experience } from '#lib/portfolio/content.js';
	let { language }: { language: Language } = $props();
	let t = $derived(copy[language]);
</script>

<h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
	Chris <span class="text-blue-700">Louwerse</span>
</h1>
<p class="mt-2 text-lg font-semibold text-blue-800">{t.role}</p>
<p class="mt-4 max-w-2xl leading-relaxed text-slate-700">{t.aboutBody}</p>
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
	href={cvUrl}
	download="ChrisLouwerseCV.pdf"
	class="mt-5 inline-flex rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus-visible:outline-2"
>
	{t.downloadCv}
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->

<section class="mt-9">
	<h2 class="text-2xl font-bold tracking-tight">{t.experience}</h2>
	<ol class="mt-4 space-y-5 border-l-2 border-blue-200 pl-4 sm:pl-6">
		{#each experience as internship (internship.organization)}
			<li>
				<article class="rounded-2xl border border-blue-100 bg-white p-4 sm:p-6">
					<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
						<h3 class="text-lg font-bold">{internship.organization}</h3>
						<span class="text-sm font-semibold text-blue-800">{internship.year}</span>
					</div>
					<p class="mt-1 text-sm font-medium text-slate-600">{internship.role[language]}</p>
					<p class="mt-3 leading-relaxed text-slate-700">{internship.description[language]}</p>
					<ul class="mt-4 flex flex-wrap gap-2">
						{#each internship.tools as tool (tool)}
							<li class="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900">
								{tool}
							</li>
						{/each}
					</ul>
				</article>
			</li>
		{/each}
	</ol>
</section>

<section class="mt-9">
	<h2 class="text-2xl font-bold tracking-tight">{t.education}</h2>
	<ul class="mt-4 grid gap-3 sm:grid-cols-2">
		{#each education as programme (programme.school)}
			<li class="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5">
				<h3 class="font-bold">{programme.school}</h3>
				<p class="mt-1 text-sm text-slate-700">{programme.programme[language]}</p>
				<p class="mt-2 text-sm font-semibold text-blue-800">{programme.years}</p>
			</li>
		{/each}
	</ul>
</section>
