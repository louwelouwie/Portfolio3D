<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { copy, type Language } from '#lib/language.js';
	import type { PortfolioAppId } from '#lib/portfolio/apps.js';
	import AboutPage from './AboutPage.svelte';
	import ContactPage from './ContactPage.svelte';
	import ProjectsPage from './ProjectsPage.svelte';
	import SkillsPage from './SkillsPage.svelte';

	let {
		app,
		language,
		onNavigate,
		projected = false,
		scrollTop = $bindable(0)
	}: {
		app: PortfolioAppId;
		language: Language;
		onNavigate: (page: PortfolioAppId) => void;
		projected?: boolean;
		scrollTop?: number;
	} = $props();
	const pages = {
		about: AboutPage,
		contact: ContactPage,
		projects: ProjectsPage,
		skills: SkillsPage
	};
	const pageOrder = ['about', 'skills', 'projects', 'contact'] as const;
	const t = $derived(copy[language]);
	let AppPage = $derived(pages[app]);
	let scrollArea = $state<HTMLDivElement>();
	let content: HTMLDivElement;
	let maxScroll = $state(0);
	let thumbHeight = $state(24);

	function measureScroll() {
		if (!scrollArea) return;
		const { clientHeight, scrollHeight } = scrollArea;
		maxScroll = Math.max(0, scrollHeight - clientHeight);
		thumbHeight = Math.max(24, ((clientHeight - 8) * clientHeight) / Math.max(1, scrollHeight));
		scrollTop = scrollArea.scrollTop;
	}

	$effect(() => {
		const area = scrollArea;
		if (area?.dataset.portfolioScroll === app) area.scrollTop = untrack(() => scrollTop);
	});

	onMount(() => {
		if (!projected || !scrollArea) return;
		const observer = new ResizeObserver(measureScroll);
		observer.observe(scrollArea);
		observer.observe(content);
		return () => observer.disconnect();
	});
</script>

<div lang={language} class="flex min-h-0 flex-1 flex-col bg-[#f3f8ff] text-[#10223d]">
	<nav
		aria-label={t.portfolioNavigation}
		class="shrink-0 border-b border-blue-100 bg-white px-3 py-2 sm:px-6"
	>
		<ul class="mx-auto grid max-w-4xl grid-cols-2 gap-1 min-[360px]:grid-cols-4 sm:flex sm:px-8">
			{#each pageOrder as id (id)}
				<li>
					<button
						type="button"
						aria-current={app === id ? 'page' : undefined}
						onclick={() => {
							if (app !== id) onNavigate(id);
						}}
						class="min-h-10 w-full cursor-pointer rounded-lg px-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 aria-[current=page]:bg-blue-100 aria-[current=page]:text-blue-950 sm:px-4 sm:text-sm"
					>
						{t[id]}
					</button>
				</li>
			{/each}
		</ul>
	</nav>
	<div class="relative flex min-h-0 flex-1">
		<div
			bind:this={scrollArea}
			data-portfolio-scroll={app}
			class="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
			class:projected
			onscroll={(event) => (scrollTop = event.currentTarget.scrollTop)}
		>
			<div bind:this={content} class="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-9">
				<AppPage {language} />
			</div>
		</div>
		{#if projected && maxScroll > 0}
			<input
				type="range"
				min="0"
				max={maxScroll}
				value={scrollTop}
				aria-label={t.appScroll}
				aria-orientation="vertical"
				style:--thumb-height={`${thumbHeight}px`}
				class="app-scrollbar"
				oninput={(event) => {
					if (scrollArea) scrollArea.scrollTop = event.currentTarget.valueAsNumber;
				}}
			/>
		{/if}
	</div>
</div>

<style>
	.projected {
		scrollbar-width: none;
	}

	.app-scrollbar {
		position: absolute;
		inset: 4px 4px 4px auto;
		width: 10px;
		writing-mode: vertical-lr;
		direction: ltr;
		appearance: none;
		border-radius: 6px;
		background: #dbe6f4;
		cursor: ns-resize;
		touch-action: none;
	}

	.app-scrollbar::-webkit-slider-thumb {
		appearance: none;
		width: 10px;
		height: var(--thumb-height);
		border-radius: 6px;
		background: #647b99;
	}

	.app-scrollbar::-moz-range-thumb {
		width: 10px;
		height: var(--thumb-height);
		border: 0;
		border-radius: 6px;
		background: #647b99;
	}
</style>
