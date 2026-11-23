<script lang="ts">
	import type { HoverTarget } from '#lib/scene/createPortfolioScene.js';
	import { copy, type Language } from '#lib/language.js';

	let {
		element = $bindable(),
		hovered,
		lastTarget,
		darkMode,
		soundEnabled,
		focused,
		language
	}: {
		element?: HTMLDivElement;
		hovered: HoverTarget;
		lastTarget: HoverTarget;
		darkMode: boolean;
		soundEnabled: boolean;
		focused: boolean;
		language: Language;
	} = $props();
	let t = $derived(copy[language]);
</script>

<div
	bind:this={element}
	class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
	aria-hidden={hovered === null || focused}
>
	<div
		class={`rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap shadow-lg ring-1 transition-all duration-300 ease-out ${darkMode ? 'bg-[#10264a]/95 text-white ring-blue-300/25' : 'bg-white/95 text-[#10223d] ring-blue-100'} ${hovered && !focused ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
	>
		{lastTarget === 'lamp'
			? darkMode
				? t.lampToLight
				: t.lampToDark
			: lastTarget === 'headphones'
				? soundEnabled
					? t.headphonesOff
					: t.headphonesOn
				: lastTarget === 'card'
					? t.cardView
					: lastTarget === 'coffee'
						? t.coffeeSip
						: lastTarget === 'printer'
							? t.printerPrint
							: lastTarget === 'phone'
								? t.phoneZoom
								: lastTarget === 'embedded'
									? t.embeddedZoom
									: t.laptopZoom}
	</div>
</div>
