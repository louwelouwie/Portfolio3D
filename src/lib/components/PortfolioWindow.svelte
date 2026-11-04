<script lang="ts">
	type Rectangle = { x: number; y: number; width: number; height: number };
	type Gesture = { kind: 'drag' | 'resize'; edge: string; x: number; y: number; rect: Rectangle };

	let {
		darkMode,
		onClose,
		onMinimize
	}: { darkMode: boolean; onClose: () => void; onMinimize: () => void } = $props();
	let maximized = $state(true);
	let rect = $state<Rectangle>({ x: 100, y: 80, width: 740, height: 520 });
	let gesture: Gesture | undefined;

	function startGesture(event: PointerEvent, kind: Gesture['kind'], edge = '') {
		if (maximized || (event.target as HTMLElement).closest('button')) return;
		gesture = { kind, edge, x: event.clientX, y: event.clientY, rect: { ...rect } };
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
		rect = next;
	}
</script>

<section
	class={`portfolio-window absolute z-40 flex flex-col overflow-hidden shadow-2xl transition-colors duration-500 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}
	class:maximized
	style={`left:${maximized ? 0 : rect.x}px;top:${maximized ? 0 : rect.y}px;width:${maximized ? '100vw' : `${rect.width}px`};height:${maximized ? 'calc(100vh - 3rem)' : `${rect.height}px`};`}
	onpointermove={moveGesture}
	onpointerup={() => (gesture = undefined)}
	onpointercancel={() => (gesture = undefined)}
	aria-label="Portfolio window"
>
	<header
		class={`transition-colors duration-500 select-none ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-900'}`}
	>
		<div
			class={`flex h-12 items-center gap-3 px-4 ${maximized ? 'cursor-default' : 'cursor-move'}`}
			onpointerdown={(event) => startGesture(event, 'drag')}
			role="toolbar"
			tabindex="-1"
			aria-label="Portfolio window controls"
		>
			<span class="font-semibold">Portfolio</span>
			<div class="ml-auto flex gap-1">
				<button
					type="button"
					onclick={onMinimize}
					aria-label="Minimize portfolio"
					class="cursor-pointer rounded px-3 py-1 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
					>−</button
				>
				<button
					type="button"
					onclick={() => (maximized = !maximized)}
					aria-label={maximized ? 'Restore portfolio window' : 'Maximize portfolio window'}
					class="cursor-pointer rounded px-3 py-1 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
					>□</button
				>
				<button
					type="button"
					onclick={onClose}
					aria-label="Close portfolio"
					class="cursor-pointer rounded px-3 py-1 hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-white"
					>×</button
				>
			</div>
		</div>
		<div
			class={`flex h-10 items-center gap-3 px-4 text-sm ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}
		>
			<span aria-hidden="true">⌂</span>
			<span
				class={`min-w-0 flex-1 truncate rounded-lg px-3 py-1 ${darkMode ? 'bg-slate-700' : 'bg-white'}`}
				>c-louwerse.com / portfolio</span
			>
		</div>
	</header>

	<div class="min-h-0 flex-1 overflow-auto scroll-smooth">
		<nav
			aria-label="Portfolio sections"
			class={`sticky top-0 z-10 flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 shadow-sm transition-colors duration-500 sm:px-10 ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}`}
		>
			<a href="#home" class="mr-auto text-xl font-bold">Portfolio</a>
			<a href="#about" class="hover:text-blue-600 focus-visible:underline">About</a>
			<a href="#skills" class="hover:text-blue-600 focus-visible:underline">Skills</a>
			<a href="#projects" class="hover:text-blue-600 focus-visible:underline">Projects</a>
		</nav>
		<section
			id="home"
			class={`grid min-h-[320px] gap-10 px-6 py-16 transition-colors duration-500 md:grid-cols-2 md:px-12 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
		>
			<div>
				<h1 class="text-5xl leading-tight font-bold">
					Chris <span class={darkMode ? 'text-blue-400' : 'text-blue-700'}>Louwerse</span>
				</h1>
				<p class="mt-4 text-2xl">Software Developer</p>
			</div>
			<div>
				<h2 class={`text-3xl font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
					Welcome
				</h2>
				<p class="mt-4 text-lg leading-relaxed">
					I build web experiences and software. This portfolio is a work in progress, starting with
					the interactive 3D laptop you just explored.
				</p>
			</div>
		</section>
		<section
			id="about"
			class={`px-6 py-14 transition-colors duration-500 md:px-12 ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
		>
			<h2 class={`text-3xl font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
				About me
			</h2>
			<p class="mt-4 max-w-3xl text-lg leading-relaxed">
				I’m Chris Louwerse, a software developer interested in web development and interactive
				interfaces. I’m using this space to share the projects I build and what I learn along the
				way.
			</p>
		</section>
		<section
			id="skills"
			class={`px-6 py-14 transition-colors duration-500 md:px-12 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}
		>
			<h2 class={`text-3xl font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
				Skills used here
			</h2>
			<ul class="mt-5 flex flex-wrap gap-3">
				{#each ['SvelteKit', 'TypeScript', 'Three.js', 'Tailwind CSS'] as skill (skill)}
					<li class={`rounded-full px-4 py-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
						{skill}
					</li>
				{/each}
			</ul>
		</section>
		<section
			id="projects"
			class={`px-6 py-14 transition-colors duration-500 md:px-12 ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
		>
			<h2 class={`text-3xl font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
				Projects
			</h2>
			<article class={`mt-5 max-w-xl rounded-xl p-6 ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
				<h3 class="text-2xl font-semibold">3D Portfolio</h3>
				<p class="mt-3 leading-relaxed">
					An interactive portfolio experiment built with SvelteKit and Three.js. The laptop screen
					contains this portfolio page.
				</p>
			</article>
		</section>
	</div>
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
