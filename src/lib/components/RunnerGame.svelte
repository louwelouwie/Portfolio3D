<script lang="ts">
	import { onMount } from 'svelte';
	import { copy, type Language } from '#lib/language.js';
	import {
		advanceRunner,
		createRunner,
		groundY,
		height,
		jump,
		playerX,
		startRunner,
		width,
		type GamePhase,
		type RunnerState
	} from '#lib/game/runner.js';

	let { language }: { language: Language } = $props();
	let t = $derived(copy[language]);
	let canvas: HTMLCanvasElement;
	let phase = $state<GamePhase>('ready');
	let score = $state(0);
	let best = $state(0);
	const game = createRunner();
	const bestKey = 'portfolio-runner-best';

	function begin() {
		startRunner(game);
		phase = game.phase;
		canvas.focus();
	}

	function press() {
		if (game.phase === 'running') jump(game);
		else begin();
	}

	function pause() {
		if (game.phase !== 'running') return;
		game.phase = 'paused';
		phase = 'paused';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(event.code)) {
			event.preventDefault();
			if (!event.repeat) press();
		} else if (event.code === 'Escape') pause();
	}

	function draw(ctx: CanvasRenderingContext2D, state: RunnerState) {
		ctx.fillStyle = '#eaf3ff';
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = '#cfe3ff';
		for (let index = 0; index < 4; index++) {
			const x = ((((index * 190 - state.distance * 0.12) % 760) + 760) % 760) - 60;
			const y = 55 + (index % 2) * 32;
			ctx.fillRect(x, y, 48, 12);
			ctx.fillRect(x + 10, y - 8, 27, 8);
		}
		ctx.fillStyle = '#a8c9f6';
		ctx.fillRect(0, groundY, width, 3);
		for (let index = 0; index < 13; index++) {
			const x = ((((index * 65 - state.distance * 0.7) % 800) + 800) % 800) - 40;
			ctx.fillRect(x, groundY + 14 + (index % 2) * 13, 22, 3);
		}

		ctx.fillStyle = '#174ea6';
		for (const obstacle of state.obstacles) {
			const x = Math.round(obstacle.x);
			const y = Math.round(groundY - obstacle.height);
			const trunkX = x + Math.round(obstacle.width * 0.4);
			ctx.fillRect(trunkX, y, 10, obstacle.height);
			ctx.fillRect(x, y + 14, 8, 7);
			ctx.fillRect(x + 4, y + 14, 6, 17);
			ctx.fillRect(trunkX + 10, y + 22, 8, 7);
			ctx.fillRect(trunkX + 14, y + 14, 6, 15);
		}

		const x = playerX;
		const y = Math.round(state.playerY);
		const runningLeg = state.phase === 'running' && state.velocityY === 0;
		const step = Math.floor(state.distance / 24) % 2;
		ctx.fillStyle = '#11346b';
		ctx.fillRect(x + 7, y + 12, 23, 22);
		ctx.fillRect(x + 20, y + 2, 19, 18);
		ctx.fillRect(x + 30, y + 15, 12, 6);
		ctx.fillRect(x + 1, y + 25, 12, 6);
		ctx.fillRect(x + 12, y + 32, 7, runningLeg && step ? 5 : 10);
		ctx.fillRect(x + 25, y + 32, 7, runningLeg && !step ? 5 : 10);
		ctx.fillStyle = '#5b9df0';
		ctx.fillRect(x + 11, y + 15, 15, 14);
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(x + 32, y + 6, 4, 4);
		ctx.fillStyle = '#11346b';
		ctx.fillRect(x + 34, y + 7, 2, 2);
	}

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.imageSmoothingEnabled = false;
		try {
			best = Number(localStorage.getItem(bestKey)) || 0;
		} catch {
			best = 0;
		}
		let frame = 0;
		let previous = performance.now();
		const tick = (now: number) => {
			advanceRunner(game, (now - previous) / 1000);
			previous = now;
			const nextScore = Math.floor(game.score);
			if (nextScore !== score) score = nextScore;
			if (game.phase !== phase) {
				phase = game.phase;
				if (phase === 'over' && score > best) {
					best = score;
					try {
						localStorage.setItem(bestKey, String(best));
					} catch {
						// The game remains playable when storage is unavailable.
					}
				}
			}
			draw(ctx, game);
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		const onVisibility = () => {
			if (document.hidden) pause();
		};
		document.addEventListener('visibilitychange', onVisibility);
		window.addEventListener('blur', pause);
		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('blur', pause);
		};
	});
</script>

<section class="w-full max-w-4xl" aria-label={t.runnerTitle}>
	<div class="mb-4 flex items-end justify-between gap-4 text-[#10223d]">
		<div>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{t.runnerTitle}</h1>
			<p class="mt-1 text-sm text-slate-600 sm:text-base">{t.runnerIntro}</p>
		</div>
		<div class="shrink-0 text-right font-mono text-sm font-semibold sm:text-base">
			<p>{t.runnerScore} {String(score).padStart(4, '0')}</p>
			<p class="text-slate-500">{t.runnerBest} {String(best).padStart(4, '0')}</p>
		</div>
	</div>
	<div class="relative overflow-hidden rounded-2xl border border-blue-200 bg-[#eaf3ff] shadow-xl">
		<canvas
			bind:this={canvas}
			{width}
			{height}
			tabindex="0"
			aria-label={t.runnerControls}
			onpointerdown={() => {
				canvas.focus();
				press();
			}}
			onkeydown={handleKeydown}
			class="block aspect-[2/1] w-full cursor-pointer touch-none focus-visible:outline-4 focus-visible:outline-blue-600"
		></canvas>
		{#if phase !== 'running'}
			<div class="absolute inset-0 flex items-center justify-center bg-[#eaf3ff]/65 px-4">
				<div
					class="rounded-2xl border border-blue-200 bg-white/95 px-6 py-5 text-center text-[#10223d] shadow-xl"
				>
					{#if phase !== 'ready'}
						<p class="mb-3 text-xl font-bold">
							{phase === 'paused' ? t.runnerPaused : t.runnerOver}
						</p>
					{/if}
					<button
						type="button"
						onclick={begin}
						class="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
						>{phase === 'over' ? t.runnerRetry : t.runnerContinue}</button
					>
				</div>
			</div>
		{/if}
	</div>
	<p class="mt-4 text-center text-sm text-slate-600">{t.runnerControls}</p>
	<span class="sr-only" aria-live="polite">{phase === 'over' ? t.runnerOver : ''}</span>
</section>
