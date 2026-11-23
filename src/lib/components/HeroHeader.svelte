<script lang="ts">
	import { copy, type Language } from '#lib/language.js';
	let { darkMode, focused, language }: { darkMode: boolean; focused: boolean; language: Language } =
		$props();
	let t = $derived(copy[language]);
</script>

<header
	class={`pointer-events-none z-10 mx-auto mt-16 flex w-[min(30rem,calc(100%-3.5rem))] flex-col items-center justify-center self-center transition-[translate,opacity,color] duration-500 ease-out sm:left-10 lg:top-10 ${focused ? '-translate-y-4 opacity-0' : 'translate-y-0 opacity-100'} ${darkMode ? 'text-white' : 'text-[#10223d]'}`}
>
	<p
		class={`text-center text-xs font-bold tracking-[0.24em] uppercase transition-colors duration-500 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}
	>
		{t.role}
	</p>
	<h1
		class="mt-3 text-center text-5xl leading-[0.98] font-extrabold tracking-tight drop-shadow-sm sm:text-6xl"
	>
		Chris <span
			class={`transition-colors duration-500 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}
			>Louwerse</span
		>
	</h1>
	<p
		class={`mt-5 max-w-md text-center text-xl leading-snug font-semibold transition-colors duration-500 sm:text-2xl ${darkMode ? 'text-white' : 'text-[#142b4b]'}`}
	>
		{t.heroLine}
	</p>
	<!-- <div class={`mt-5 h-1 w-12 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-700'}`}></div> -->
	<!-- <p
		class={`mt-4 max-w-sm text-sm leading-relaxed font-medium sm:text-base ${darkMode ? 'text-blue-100' : 'text-slate-800'}`}
	>
		{t.heroDescription}
	</p> -->
</header>
