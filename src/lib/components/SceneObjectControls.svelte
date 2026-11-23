<script lang="ts">
	import { copy, type Language } from '#lib/language.js';
	import type { FocusTarget, HoverTarget } from '#lib/scene/createPortfolioScene.js';

	let {
		darkMode,
		focused,
		hovered,
		preferredDevice,
		language,
		onTogglePortfolio
	}: {
		darkMode: boolean;
		focused: FocusTarget | null;
		hovered: HoverTarget;
		preferredDevice: 'laptop' | 'phone';
		language: Language;
		onTogglePortfolio: () => void;
	} = $props();
	let t = $derived(copy[language]);
	let label = $derived(focused ? t.backToDesk : t.openPortfolio);
</script>

<nav aria-label={t.objectControls} class="flex items-center">
	<button
		type="button"
		aria-label={label}
		title={label}
		onclick={onTogglePortfolio}
		class={`pointer-events-auto flex h-11 w-[min(10.5rem,calc(100vw-9.5rem))] cursor-pointer items-center justify-center gap-2 rounded-xl border px-2 text-sm font-semibold shadow-lg backdrop-blur-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-blue-600 sm:w-auto sm:px-4 ${darkMode ? 'border-blue-300/25 bg-[#10264a]/95 text-white hover:bg-[#1d3c69]' : 'border-blue-200 bg-white/95 text-[#10223d] hover:bg-blue-50'} ${hovered === preferredDevice ? (darkMode ? 'bg-[#1d3c69]' : 'bg-blue-50') : ''}`}
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			class="size-5 shrink-0"
			>{#if focused}<path d="m15 18-6-6 6-6M9 12h12" />{:else if preferredDevice === 'phone'}<rect
					x="7"
					y="2"
					width="10"
					height="20"
					rx="2"
				/><path d="M11 18h2" />{:else}<rect x="4" y="4" width="16" height="12" rx="1" /><path
					d="M2 20h20"
				/>{/if}</svg
		>
		<span>{label}</span>
	</button>
</nav>
