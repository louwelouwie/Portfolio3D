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
	let icon = $derived(focused ?? preferredDevice);
</script>

<nav
	aria-label={t.objectControls}
	class={`pointer-events-none fixed z-50 flex items-center ${focused ? 'top-4 left-4' : 'inset-x-0 bottom-4 justify-center gap-3'}`}
>
	<button
		type="button"
		aria-label={label}
		title={label}
		onclick={onTogglePortfolio}
		class={`pointer-events-auto flex h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-lg backdrop-blur-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-blue-600 ${darkMode ? 'border-blue-300/25 bg-[#10264a]/95 text-white hover:bg-[#1d3c69]' : 'border-blue-200 bg-white/95 text-[#10223d] hover:bg-blue-50'} ${hovered === preferredDevice ? (darkMode ? 'bg-[#1d3c69]' : 'bg-blue-50') : ''}`}
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			class="h-5 w-5"
			>{#if focused}<path d="m15 18-6-6 6-6M9 12h12" />{:else if icon === 'phone'}<rect
					x="7"
					y="2"
					width="10"
					height="20"
					rx="2"
				/><path d="M11 18h2" />{:else if icon === 'embedded'}<rect
					x="3"
					y="5"
					width="18"
					height="14"
					rx="2"
				/><path d="M7 12h4m-2-2v4m6-2h.01m3 0h.01" />{:else}<rect
					x="4"
					y="4"
					width="16"
					height="12"
					rx="1"
				/><path d="M2 20h20" />{/if}</svg
		>
		<span>{label}</span>
	</button>
</nav>
