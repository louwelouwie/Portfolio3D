import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

/** Expand an app window from its desktop icon and shrink it back on close. */
export function windowToIcon(node: HTMLElement, { iconId }: { iconId: string }): TransitionConfig {
	const icon = [...node.ownerDocument.querySelectorAll<HTMLElement>('[data-desktop-icon]')].find(
		(element) => element.dataset.desktopIcon === iconId
	);
	const from = (icon?.querySelector('svg')?.parentElement ?? icon)?.getBoundingClientRect();
	const to = node.getBoundingClientRect();
	const offsetX = from ? from.left - to.left : 0;
	const offsetY = from ? from.top - to.top : 0;
	const scaleX = from && to.width ? from.width / to.width : 0.08;
	const scaleY = from && to.height ? from.height / to.height : 0.08;

	return {
		duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420,
		easing: cubicOut,
		css: (t) =>
			`transform-origin: top left; transform: translate(${offsetX * (1 - t)}px, ${offsetY * (1 - t)}px) scale(${scaleX + (1 - scaleX) * t}, ${scaleY + (1 - scaleY) * t}); opacity: ${t};`
	};
}
