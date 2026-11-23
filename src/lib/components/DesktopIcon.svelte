<script lang="ts">
	import { onMount } from 'svelte';
	import LauncherIcon from './LauncherIcon.svelte';
	import type { LauncherItem } from '#lib/portfolio/launcher.js';
	import {
		iconPositionKey,
		parseIconPosition,
		saveIconPosition
	} from '#lib/desktop/iconPosition.js';
	import { iconSize, placeIcon } from '#lib/desktop/iconLayout.js';

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
		item,
		dragHint,
		unavailableHint,
		darkMode,
		startX,
		startY,
		width = iconSize,
		height = iconSize,
		gap,
		onOpenApp
	}: {
		id: string;
		item: LauncherItem;
		dragHint: string;
		unavailableHint: string;
		darkMode: boolean;
		startX: number;
		startY: number;
		width?: number;
		height?: number;
		gap?: number;
		onOpenApp: (id: Extract<LauncherItem, { kind: 'app' }>['id']) => void;
	} = $props();

	const href = $derived(item.kind === 'shortcut' ? item.href : undefined);
	const download = $derived(item.kind === 'shortcut' ? item.download : undefined);
	const unavailable = $derived(item.kind === 'shortcut' && !href);
	let button = $state<HTMLElement>();
	let x = $state(0);
	let y = $state(0);
	let positioned = $state(false);
	let dragging = $state(false);
	let gesture: Gesture | undefined;
	let suppressClick = false;

	function moveTo(nextX: number, nextY: number, avoidOverlap = false) {
		const parent = button?.parentElement;
		if (!parent || !button) return;
		const occupied = [...parent.querySelectorAll<HTMLElement>('[data-desktop-icon]')]
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
			button.offsetHeight,
			gap
		);
		x = next.x;
		y = next.y;
	}

	function startDrag(event: PointerEvent) {
		if (event.button !== 0 || !button) return;
		suppressClick = false;
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
		if (!event.buttons) {
			endDrag(event);
			return;
		}
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
		if (suppressClick && event.detail !== 0) {
			event.preventDefault();
			suppressClick = false;
			return;
		}
		if (item.kind === 'app') onOpenApp(item.id);
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

<svelte:window onpointermove={moveDrag} onpointerup={endDrag} onpointercancel={endDrag} />

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<svelte:element
	this={href ? 'a' : 'button'}
	bind:this={button}
	type={href ? undefined : 'button'}
	{href}
	{download}
	target={href && !download && !href.startsWith('mailto:') ? '_blank' : undefined}
	rel={href ? 'noopener noreferrer' : undefined}
	draggable={false}
	data-desktop-icon={id}
	role={href ? 'link' : 'button'}
	aria-label={item.label}
	aria-disabled={unavailable || undefined}
	title={`${item.label} — ${unavailable ? unavailableHint : dragHint}`}
	class={`group absolute flex touch-none flex-col items-center gap-1 rounded-xl p-1 text-center text-white transition-[background-color,box-shadow,translate,scale] duration-200 ease-out select-none focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none motion-reduce:transition-none ${dragging ? 'z-30 scale-105 cursor-grabbing bg-white/20 shadow-lg' : 'z-10 cursor-grab hover:-translate-y-1 hover:scale-105 hover:bg-white/15 hover:shadow-md'}`}
	style={`width:${width}px;height:${height}px;left:${x}px;top:${y}px;visibility:${positioned ? 'visible' : 'hidden'};`}
	onpointerdown={startDrag}
	onkeydown={moveWithKeyboard}
	onclick={activate}
>
	<span
		aria-hidden="true"
		class={`flex size-14 min-h-0 items-center justify-center rounded-xl shadow-md ring-1 transition-shadow duration-200 group-hover:shadow-xl ${darkMode ? 'bg-[#091a35] text-blue-300 ring-blue-300/25' : 'bg-white text-blue-700 ring-blue-100'}`}
	>
		<LauncherIcon icon={item.id} />
	</span>
	<span class="line-clamp-2 w-full text-sm leading-tight font-semibold">{item.label}</span>
</svelte:element>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
