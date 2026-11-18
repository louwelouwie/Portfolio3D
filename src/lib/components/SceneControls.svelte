<script lang="ts">
	import { copy, type Language } from '#lib/language.js';

	let {
		darkMode,
		soundEnabled,
		language,
		onToggleTheme,
		onToggleSound,
		onToggleLanguage
	}: {
		darkMode: boolean;
		soundEnabled: boolean;
		language: Language;
		onToggleTheme: () => void;
		onToggleSound: () => void;
		onToggleLanguage: () => void;
	} = $props();
	let t = $derived(copy[language]);
</script>

<nav
	aria-label={t.quickControls}
	class={`fixed top-3 right-3 z-50 flex items-center gap-1.5 rounded-xl border p-1.5 shadow-xl backdrop-blur-sm sm:top-4 sm:right-4 ${darkMode ? 'border-blue-300/25 bg-[#10264a]/95 text-white' : 'border-blue-200 bg-white/90 text-[#10223d]'}`}
>
	<button
		type="button"
		aria-label={darkMode ? t.lightMode : t.darkMode}
		title={darkMode ? t.lightMode : t.darkMode}
		onclick={onToggleTheme}
		class={`flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-600 ${darkMode ? 'hover:bg-blue-300/20' : 'hover:bg-blue-100'}`}
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			class="h-4 w-4"
		>
			{#if darkMode}<path d="M20 15.3A8 8 0 0 1 8.7 4a8 8 0 1 0 11.3 11.3Z" />{:else}<circle
					cx="12"
					cy="12"
					r="4"
				/><path
					d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
				/>{/if}
		</svg>
		<span class="hidden sm:inline">{darkMode ? t.lightMode : t.darkMode}</span>
	</button>
	<button
		type="button"
		aria-label={soundEnabled ? t.soundOn : t.soundOff}
		aria-pressed={soundEnabled}
		title={soundEnabled ? t.soundOn : t.soundOff}
		onclick={onToggleSound}
		class={`flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-600 ${darkMode ? 'hover:bg-blue-300/20' : 'hover:bg-blue-100'}`}
	>
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			class="h-4 w-4"
			><path d="M11 5 6 9H3v6h3l5 4V5Z" />{#if soundEnabled}<path
					d="M15 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"
				/>{:else}<path d="m16 9 5 6m0-6-5 6" />{/if}</svg
		>
		<span class="hidden sm:inline">{soundEnabled ? t.soundOn : t.soundOff}</span>
	</button>
	<button
		type="button"
		aria-label={t.changeLanguage}
		title={t.changeLanguage}
		onclick={onToggleLanguage}
		class={`flex h-10 items-center gap-1 rounded-lg px-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 ${darkMode ? 'hover:bg-blue-300/20' : 'hover:bg-blue-100'}`}
	>
		<span class:font-extrabold={language === 'en'}>EN</span>
		<span aria-hidden="true">/</span>
		<span class:font-extrabold={language === 'nl'}>NL</span>
	</button>
</nav>
