import type { Action } from 'svelte/action';

export const animateControlPress: Action<HTMLElement> = (control) => {
	const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
	let animation: Animation | undefined;

	function press() {
		if (reducedMotion.matches) return;
		animation?.cancel();
		animation = control.animate([{ scale: 1 }, { scale: 0.94, offset: 0.35 }, { scale: 1 }], {
			duration: 180,
			easing: 'ease-out'
		});
	}

	control.addEventListener('click', press);
	return {
		destroy() {
			control.removeEventListener('click', press);
			animation?.cancel();
		}
	};
};
