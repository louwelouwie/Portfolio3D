<script lang="ts">
	import { copy, type Language } from '#lib/language.js';

	let {
		darkMode,
		focused,
		language,
		onToggleLaptop
	}: {
		darkMode: boolean;
		focused: boolean;
		language: Language;
		onToggleLaptop: () => void;
	} = $props();
	let t = $derived(copy[language]);
</script>

<nav
	aria-label={t.objectControls}
	class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3"
>
	<button
		type="button"
		aria-label={focused ? t.backToDesk : t.openLaptop}
		title={focused ? t.backToDesk : t.openLaptop}
		onclick={onToggleLaptop}
		class={`flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-lg backdrop-blur-sm transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${darkMode ? 'border-blue-300/25 bg-[#10264a]/95 text-white hover:bg-[#1d3c69]' : 'border-blue-200 bg-white/95 text-[#10223d] hover:bg-blue-50'}`}
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			class="h-5 w-5"><rect x="4" y="4" width="16" height="12" rx="1" /><path d="M2 20h20" /></svg
		>
		<span>{focused ? t.backToDesk : t.openLaptop}</span>
	</button>
</nav>
