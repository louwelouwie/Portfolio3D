<script lang="ts">
	import { socialIconPaths } from '#lib/socialIcons.js';
	import type { LauncherItem } from '#lib/portfolio/launcher.js';

	let { icon }: { icon: LauncherItem['id'] } = $props();

	const outlines = {
		skills: 'm8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18',
		about: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m12-14a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
		contact: 'M5 4h15v16H5zM5 8H3m2 4H3m2 4H3m12-6a2 2 0 1 1-4 0 2 2 0 0 1 4 0m-6 6a4 4 0 0 1 8 0',
		projects: 'M3 7V5h6l2 2h10v13H3z',
		cv: 'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6',
		artisanBouwservice: 'm2 11 10-8 10 8M5 9v12h14V9m-9 12v-6h4v6',
		monkeyEmpires:
			'M7 7h10a4 4 0 0 1 4 3l1 5a3 3 0 0 1-5 3l-2-2H9l-2 2a3 3 0 0 1-5-3l1-5a4 4 0 0 1 4-3zm1 3v4m-2-2h4m6-1h.01m2 2h.01'
	};
</script>

{#if icon === 'github' || icon === 'linkedin' || icon === 'email'}
	<svg aria-hidden="true" viewBox="0 0 16 16" class="size-7" fill="currentColor">
		<path d={socialIconPaths[icon]} />
	</svg>
{:else}
	<svg
		aria-hidden="true"
		viewBox="0 0 24 24"
		class="size-7"
		fill="none"
		stroke="currentColor"
		stroke-width="1.75"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d={outlines[icon]} />
	</svg>
{/if}
