<script lang="ts">
	import { onMount } from 'svelte';
	import {
		iconPositionKey,
		parseIconPosition,
		saveIconPosition
	} from '#lib/desktop/iconPosition.js';
	import { placeIcon } from '#lib/desktop/iconLayout.js';

	type Gesture = {
		pointerId: number;
		pointerX: number;
		pointerY: number;
		startX: number;
		startY: number;
		moved: boolean;
	};

	let {
		id,
		label,
		dragHint,
		image,
		letter,
		darkMode,
		startX,
		startY,
		onActivate
	}: {
		id: string;
		label: string;
		dragHint: string;
		image?: string;
		letter?: string;
		darkMode: boolean;
		startX: number;
		startY: number;
		onActivate?: () => void;
	} = $props();

	let button = $state<HTMLButtonElement>();
	let x = $state(0);
	let y = $state(0);
	let positioned = $state(false);
	let dragging = $state(false);
	let gesture: Gesture | undefined;
	let suppressClick = false;

	function moveTo(nextX: number, nextY: number, avoidOverlap = false) {
		const parent = button?.parentElement;
		if (!parent || !button) return;
		const occupied = [...parent.querySelectorAll<HTMLButtonElement>('[data-desktop-icon]')]
			.filter((other) => other !== button)
			.map((other) => ({
				x: Number.parseFloat(other.style.left) || 0,
				y: Number.parseFloat(other.style.top) || 0,
				width: other.offsetWidth,
				height: other.offsetHeight
			}));
		const next = placeIcon(
			{ x: nextX, y: nextY },
			avoidOverlap ? occupied : [],
			{ width: parent.clientWidth, height: parent.clientHeight },
			button.offsetWidth,
			button.offsetHeight
		);
		x = next.x;
		y = next.y;
	}

	function startDrag(event: PointerEvent) {
		if (event.button !== 0 || !button) return;
		gesture = {
			pointerId: event.pointerId,
			pointerX: event.clientX,
			pointerY: event.clientY,
			startX: x,
			startY: y,
			moved: false
		};
		dragging = true;
		button.setPointerCapture(event.pointerId);
	}

	function moveDrag(event: PointerEvent) {
		if (!gesture || event.pointerId !== gesture.pointerId) return;
		const dx = event.clientX - gesture.pointerX;
		const dy = event.clientY - gesture.pointerY;
		if (Math.hypot(dx, dy) > 5) gesture.moved = true;
		if (gesture.moved) moveTo(gesture.startX + dx, gesture.startY + dy);
	}

	function endDrag(event: PointerEvent) {
		if (!gesture || event.pointerId !== gesture.pointerId) return;
		suppressClick = gesture.moved;
		if (gesture.moved) {
			moveTo(x, y, true);
			saveIconPosition(id, { x, y });
		}
		gesture = undefined;
		dragging = false;
		if (button?.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
	}

	function activate(event: MouseEvent) {
		if (suppressClick) {
			event.preventDefault();
			suppressClick = false;
			return;
		}
		onActivate?.();
	}

	function moveWithKeyboard(event: KeyboardEvent) {
		const movement: Record<string, [number, number]> = {
			ArrowLeft: [-16, 0],
			ArrowRight: [16, 0],
			ArrowUp: [0, -16],
			ArrowDown: [0, 16]
		};
		const step = movement[event.key];
		if (!step) return;
		event.preventDefault();
		moveTo(x + step[0], y + step[1], true);
		saveIconPosition(id, { x, y });
	}

	onMount(() => {
		const parent = button?.parentElement;
		if (!parent) return;
		x = startX;
		y = startY;
		positioned = true;
		const onStorage = (event: StorageEvent) => {
			if (event.key !== iconPositionKey(id)) return;
			const next = parseIconPosition(event.newValue);
			if (next) moveTo(next.x, next.y, true);
		};
		window.addEventListener('storage', onStorage);
		const observer = new ResizeObserver(() => moveTo(x, y, true));
		observer.observe(parent);
		moveTo(x, y);
		return () => {
			observer.disconnect();
			window.removeEventListener('storage', onStorage);
		};
	});
</script>

<button
	bind:this={button}
	type="button"
	data-desktop-icon={id}
	aria-label={label}
	title={`${label} — ${dragHint}`}
	class={`group absolute flex h-24 w-24 touch-none flex-col items-center gap-1 rounded-xl p-1 text-center text-white transition-[background-color,box-shadow,translate,scale] duration-200 ease-out select-none focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none motion-reduce:transition-none ${dragging ? 'z-30 scale-105 cursor-grabbing bg-white/20 shadow-lg' : 'z-10 cursor-grab hover:-translate-y-1 hover:scale-105 hover:bg-white/15 hover:shadow-md'}`}
	style={`left:${x}px;top:${y}px;visibility:${positioned ? 'visible' : 'hidden'};`}
	onpointerdown={startDrag}
	onpointermove={moveDrag}
	onpointerup={endDrag}
	onpointercancel={endDrag}
	onkeydown={moveWithKeyboard}
	onclick={activate}
>
	{#if image}
		<img
			src={image}
			alt=""
			draggable="false"
			class="h-14 w-14 rounded-xl bg-white object-cover shadow-md transition-shadow duration-200 group-hover:shadow-xl"
		/>
	{:else}
		<span
			aria-hidden="true"
			class={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl font-extrabold shadow-md ring-1 transition-[box-shadow,transform] duration-200 group-hover:shadow-xl ${darkMode ? 'bg-[#091a35] text-blue-300 ring-blue-300/25' : 'bg-white text-blue-700 ring-blue-100'}`}
			>{letter}</span
		>
	{/if}
	<span class="w-full truncate text-sm font-semibold">{label}</span>
</button>
