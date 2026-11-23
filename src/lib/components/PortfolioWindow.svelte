<script lang="ts">
	import PortfolioContent from '#lib/components/PortfolioContent.svelte';
	import { windowToIcon } from '#lib/desktop/windowToIcon.js';
	import { copy, type Language } from '#lib/language.js';
	type Rectangle = { x: number; y: number; width: number; height: number };
	type Gesture = { kind: 'drag' | 'resize'; edge: string; x: number; y: number; rect: Rectangle };
	const taskbarHeight = 48;
	const titlebarHeight = 48;
	const visibleWidth = 144;

	let {
		darkMode,
		language,
		maximized,
		onMaximizedChange,
		onClose,
		onMinimize
	}: {
		darkMode: boolean;
		language: Language;
		maximized: boolean;
		onMaximizedChange: (value: boolean) => void;
		onClose: () => void;
		onMinimize: () => void;
	} = $props();
	let t = $derived(copy[language]);
	function centeredRect(): Rectangle {
		const width = Math.min(740, Math.max(Math.min(420, window.innerWidth), window.innerWidth - 40));
		const height = Math.min(520, Math.max(280, window.innerHeight - 88));
		return {
			x: Math.max(0, (window.innerWidth - width) / 2),
			y: Math.max(0, (window.innerHeight - taskbarHeight - height) / 2),
			width,
			height
		};
	}
	function keepTitlebarInFrame(next: Rectangle): Rectangle {
		const visible = Math.min(visibleWidth, window.innerWidth);
		return {
			...next,
			x: Math.max(visible - next.width, Math.min(next.x, window.innerWidth - visible)),
			y: Math.max(0, Math.min(next.y, window.innerHeight - taskbarHeight - titlebarHeight))
		};
	}
	let rect = $state<Rectangle>(centeredRect());
	let gesture = $state<Gesture>();
	let hoveredAction = $state<'minimize' | 'resize' | null>(null);

	function startGesture(event: PointerEvent, kind: Gesture['kind'], edge = '') {
		if ((maximized && kind === 'resize') || (event.target as HTMLElement).closest('button')) return;
		let startRect = rect;
		if (maximized) {
			const restored = centeredRect();
			const fraction = Math.max(0.1, Math.min(event.clientX / window.innerWidth, 0.9));
			startRect = keepTitlebarInFrame({
				...restored,
				x: event.clientX - restored.width * fraction,
				y: event.clientY - titlebarHeight / 2
			});
			rect = startRect;
			onMaximizedChange(false);
		}
		gesture = { kind, edge, x: event.clientX, y: event.clientY, rect: { ...startRect } };
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		event.preventDefault();
	}

	function moveGesture(event: PointerEvent) {
		if (!gesture) return;
		const dx = event.clientX - gesture.x;
		const dy = event.clientY - gesture.y;
		const next = { ...gesture.rect };
		if (gesture.kind === 'drag') {
			next.x += dx;
			next.y += dy;
		} else {
			if (gesture.edge.includes('r')) next.width += dx;
			if (gesture.edge.includes('b')) next.height += dy;
			if (gesture.edge.includes('l')) {
				next.width -= dx;
				next.x += dx;
			}
			if (gesture.edge.includes('t')) {
				next.height -= dy;
				next.y += dy;
			}
			if (next.width < 420) {
				if (gesture.edge.includes('l')) next.x -= 420 - next.width;
				next.width = 420;
			}
			if (next.height < 280) {
				if (gesture.edge.includes('t')) next.y -= 280 - next.height;
				next.height = 280;
			}
		}
		rect = keepTitlebarInFrame(next);
	}
</script>

<svelte:window onresize={() => (rect = keepTitlebarInFrame(rect))} />

<section
	transition:windowToIcon={{ iconId: 'portfolio' }}
	class={`portfolio-window absolute z-40 flex flex-col overflow-hidden shadow-2xl ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${gesture ? 'transition-none' : 'transition-[left,top,width,height,border-radius,background-color,color] duration-[380ms]'} ${maximized ? 'rounded-none' : 'rounded-xl'} ${darkMode ? 'bg-[#0c1d35] text-slate-50' : 'bg-white text-[#10223d]'}`}
	class:maximized
	style={`left:${maximized ? 0 : rect.x}px;top:${maximized ? 0 : rect.y}px;width:${maximized ? '100vw' : `${rect.width}px`};height:${maximized ? 'calc(100vh - 3rem)' : `${rect.height}px`};`}
	onpointermove={moveGesture}
	onpointerup={() => (gesture = undefined)}
	onpointercancel={() => (gesture = undefined)}
	aria-label={t.portfolio}
>
	<header
		class={`border-b transition-colors duration-500 select-none ${darkMode ? 'border-blue-300/20 bg-[#17345a] text-white' : 'border-blue-200 bg-[#dceafb] text-[#10223d]'}`}
	>
		<div
			class={`flex h-12 touch-none items-center gap-3 px-4 ${gesture?.kind === 'drag' ? 'cursor-grabbing' : 'cursor-grab'}`}
			onpointerdown={(event) => startGesture(event, 'drag')}
			role="toolbar"
			tabindex="-1"
			aria-label={t.portfolio}
		>
			<span class="text-sm font-bold tracking-wide">{t.portfolio}</span>
			<div class="ml-auto flex gap-1">
				<button
					type="button"
					onclick={onMinimize}
					onpointerenter={() => (hoveredAction = 'minimize')}
					onmousemove={() => (hoveredAction = 'minimize')}
					onpointerleave={() => (hoveredAction = null)}
					onfocus={() => (hoveredAction = 'minimize')}
					onblur={() => (hoveredAction = null)}
					aria-label={t.minimizePortfolio}
					title={t.minimizePortfolio}
					class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-[background-color,color,scale] duration-200 focus-visible:outline-2 focus-visible:outline-blue-500"
					style={`background-color:${hoveredAction === 'minimize' ? (darkMode ? '#355e91' : '#2563eb') : 'transparent'};color:${hoveredAction === 'minimize' ? 'white' : 'inherit'};scale:${hoveredAction === 'minimize' ? '1.1' : '1'};`}
					><svg
						aria-hidden="true"
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M5 12h14" /></svg
					></button
				>
				<button
					type="button"
					onclick={() => onMaximizedChange(!maximized)}
					onpointerenter={() => (hoveredAction = 'resize')}
					onmousemove={() => (hoveredAction = 'resize')}
					onpointerleave={() => (hoveredAction = null)}
					onfocus={() => (hoveredAction = 'resize')}
					onblur={() => (hoveredAction = null)}
					aria-label={maximized ? t.restorePortfolio : t.maximizePortfolio}
					title={maximized ? t.restorePortfolio : t.maximizePortfolio}
					class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-[background-color,color,scale] duration-200 focus-visible:outline-2 focus-visible:outline-blue-500"
					style={`background-color:${hoveredAction === 'resize' ? (darkMode ? '#355e91' : '#2563eb') : 'transparent'};color:${hoveredAction === 'resize' ? 'white' : 'inherit'};scale:${hoveredAction === 'resize' ? '1.1' : '1'};`}
					><svg
						aria-hidden="true"
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2" /></svg
					></button
				>
				<button
					type="button"
					onclick={onClose}
					aria-label={t.closePortfolio}
					class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors duration-200 hover:bg-red-600 hover:text-white focus-visible:outline-2 focus-visible:outline-blue-500"
					><svg
						aria-hidden="true"
						class="h-4 w-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"><path d="M6 6l12 12M18 6 6 18" /></svg
					></button
				>
			</div>
		</div>
		<div
			class={`flex h-10 items-center gap-3 px-4 text-sm ${darkMode ? 'bg-[#0a1c36]' : 'bg-[#eff6ff]'}`}
		>
			<svg
				aria-hidden="true"
				class={`h-4 w-4 shrink-0 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"><path d="m3 10 9-7 9 7v10H3z" /><path d="M9 20v-6h6v6" /></svg
			>
			<span
				class={`min-w-0 flex-1 truncate rounded-md border px-3 py-1 font-medium ${darkMode ? 'border-blue-300/20 bg-[#254467] text-blue-50' : 'border-blue-100 bg-white text-[#203c62]'}`}
				>c-louwerse.com / portfolio</span
			>
		</div>
	</header>

	<PortfolioContent {darkMode} {language} />

	{#if !maximized}
		{#each ['t', 'b', 'l', 'r', 'tl', 'tr', 'bl', 'br'] as edge (edge)}
			<div
				class={`resize-handle ${edge}`}
				role="presentation"
				onpointerdown={(event) => startGesture(event, 'resize', edge)}
			></div>
		{/each}
	{/if}
</section>
