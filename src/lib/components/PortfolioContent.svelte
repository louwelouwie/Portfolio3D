<script lang="ts">
	import { copy, type Language } from '#lib/language.js';
	type Section = 'home' | 'about' | 'skills' | 'projects';

	let { darkMode, language }: { darkMode: boolean; language: Language } = $props();
	let t = $derived(copy[language]);
	const navigationSections = ['about', 'skills', 'projects'] as const;
	let scrollArea = $state<HTMLDivElement>();
	let navigation = $state<HTMLElement>();

	function goTo(section: Section) {
		const target = scrollArea?.querySelector<HTMLElement>(`#${section}`);
		if (!scrollArea || !target) return;
		const top = Math.max(0, target.offsetTop - (navigation?.offsetHeight ?? 0));
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) scrollArea.scrollTop = top;
		else scrollArea.scrollTo({ top, behavior: 'smooth' });
	}
</script>

<div bind:this={scrollArea} class="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
	<nav
		bind:this={navigation}
		aria-label={t.navigationLabel}
		class={`sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-6 py-4 shadow-sm transition-colors duration-500 sm:px-10 ${darkMode ? 'border-blue-300/20 bg-[#102a4c] text-blue-50' : 'border-blue-100 bg-white text-[#10223d]'}`}
	>
		<button
			type="button"
			onclick={() => goTo('home')}
			class="mr-auto cursor-pointer text-xl font-extrabold tracking-tight focus-visible:underline"
			>{t.portfolio}</button
		>
		{#each navigationSections as section (section)}
			<button
				type="button"
				onclick={() => goTo(section as Section)}
				class={`cursor-pointer font-semibold focus-visible:underline ${darkMode ? 'hover:text-blue-300' : 'hover:text-blue-700'}`}
				>{t[section]}</button
			>
		{/each}
	</nav>

	<section
		id="home"
		class={`grid min-h-[320px] gap-10 px-6 py-16 transition-colors duration-500 md:grid-cols-2 md:px-12 ${darkMode ? 'bg-[#0c1d35] text-white' : 'bg-[#f3f8ff] text-[#10223d]'}`}
	>
		<div>
			<h1 class="text-5xl leading-tight font-extrabold tracking-tight">
				Chris <span class={darkMode ? 'text-blue-300' : 'text-blue-700'}>Louwerse</span>
			</h1>
			<p class="mt-4 text-2xl font-semibold">{t.role}</p>
		</div>
		<div>
			<h2 class={`text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
				{t.welcome}
			</h2>
			<p class="mt-4 text-lg leading-relaxed">
				{t.welcomeBody}
			</p>
		</div>
	</section>
	<section
		id="about"
		class={`px-6 py-14 transition-colors duration-500 md:px-12 ${darkMode ? 'bg-[#102846] text-blue-50' : 'bg-white text-[#10223d]'}`}
	>
		<h2 class={`text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
			{t.aboutHeading}
		</h2>
		<p class="mt-4 max-w-3xl text-lg leading-relaxed">
			{t.aboutBody}
		</p>
	</section>
	<section
		id="skills"
		class={`px-6 py-14 transition-colors duration-500 md:px-12 ${darkMode ? 'bg-[#0c1d35] text-white' : 'bg-[#f3f8ff] text-[#10223d]'}`}
	>
		<h2 class={`text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
			{t.skillsHeading}
		</h2>
		<ul class="mt-5 flex flex-wrap gap-3">
			{#each ['SvelteKit', 'TypeScript', 'Three.js', 'Tailwind CSS'] as skill (skill)}
				<li
					class={`rounded-full px-4 py-2 font-semibold ${darkMode ? 'bg-[#254467] text-blue-50' : 'bg-[#dceafb] text-blue-900'}`}
				>
					{skill}
				</li>
			{/each}
		</ul>
	</section>
	<section
		id="projects"
		class={`px-6 py-14 transition-colors duration-500 md:px-12 ${darkMode ? 'bg-[#102846] text-blue-50' : 'bg-white text-[#10223d]'}`}
	>
		<h2 class={`text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
			{t.projects}
		</h2>
		<article
			class={`mt-5 max-w-xl rounded-xl border p-6 ${darkMode ? 'border-blue-300/15 bg-[#18375b]' : 'border-blue-100 bg-[#f3f8ff]'}`}
		>
			<h3 class="text-2xl font-bold">{t.projectTitle}</h3>
			<p class="mt-3 leading-relaxed">
				{t.projectBody}
			</p>
		</article>
	</section>
</div>
