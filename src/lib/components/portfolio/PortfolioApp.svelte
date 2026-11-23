<script lang="ts">
	import { onMount } from 'svelte';
	import { copy, type Language } from '#lib/language.js';
	import type { PortfolioAppId } from '#lib/portfolio/apps.js';
	import AboutPage from './AboutPage.svelte';
	import ContactPage from './ContactPage.svelte';
	import ProjectsPage from './ProjectsPage.svelte';
	import SkillsPage from './SkillsPage.svelte';

	let {
		app,
		language,
		projected = false
	}: { app: PortfolioAppId; language: Language; projected?: boolean } = $props();
	const pages = {
		about: AboutPage,
		contact: ContactPage,
		projects: ProjectsPage,
		skills: SkillsPage
	};
	let AppPage = $derived(pages[app]);
	let scrollArea: HTMLDivElement;
	let content: HTMLDivElement;
	let scrollTop = $state(0);
	let maxScroll = $state(0);
	let thumbHeight = $state(24);

	function measureScroll() {
		const { clientHeight, scrollHeight } = scrollArea;
		maxScroll = Math.max(0, scrollHeight - clientHeight);
		thumbHeight = Math.max(24, ((clientHeight - 8) * clientHeight) / Math.max(1, scrollHeight));
		scrollTop = scrollArea.scrollTop;
	}

	onMount(() => {
		if (!projected) return;
		const observer = new ResizeObserver(measureScroll);
		observer.observe(scrollArea);
		observer.observe(content);
		return () => observer.disconnect();
	});
</script>

<div class="relative flex min-h-0 flex-1 bg-[#f3f8ff] text-[#10223d]">
	<div
		bind:this={scrollArea}
		data-portfolio-scroll
		class="min-h-0 flex-1 overflow-y-auto overscroll-contain"
		class:projected
		onscroll={() => {
			if (projected) scrollTop = scrollArea.scrollTop;
		}}
	>
		<div bind:this={content} class="p-6 md:p-10">
			<AppPage {language} />
		</div>
	</div>
	{#if projected && maxScroll > 0}
		<input
			type="range"
			min="0"
			max={maxScroll}
			value={scrollTop}
			aria-label={copy[language].appScroll}
			aria-orientation="vertical"
			style:--thumb-height={`${thumbHeight}px`}
			class="app-scrollbar"
			oninput={(event) => (scrollArea.scrollTop = event.currentTarget.valueAsNumber)}
		/>
	{/if}
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
