<!-- Chris Louwerse 23/11/2026 -->

<script lang="ts">
	import { contactLinks } from '#lib/contact.js';

	let { interactive }: { interactive: boolean } = $props();
</script>

<article
	class="flex h-full w-full flex-col bg-black text-lg font-semibold text-white"
	aria-label="Chris Louwerse contact card"
	inert={!interactive}
>
	<div class="flex h-2/5 w-full flex-row items-center gap-3 p-8">
		<div
			class="aspect-square h-16 w-16 rounded-full border-2 border-solid border-gray-700 bg-white"
			aria-hidden="true"
		></div>
		<div class="flex h-16 w-3/5 flex-col justify-center">
			<h2 class="text-xl">Chris Louwerse</h2>
			<p class="text-sm text-gray-200">Software developer · Westervoort</p>
		</div>
	</div>

	<nav
		class="grid h-3/5 grid-cols-2 items-center justify-center border-t-3 bg-gray-950"
		aria-label="Contact links"
	>
		<div class="flex flex-row items-center justify-center gap-3">
			<div
				class="aspect-square h-12 w-12 rounded-full border-2 border-solid border-gray-700 bg-white"
				aria-hidden="true"
			></div>
			<div class="flex w-3/5 flex-col justify-center">
				<a
					href={contactLinks.github}
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-200">Github</a
				>
				<p class="text-xl">louwelouwie</p>
			</div>
		</div>
				<div class="flex flex-row items-center justify-center gap-3">
			<div
				class="aspect-square h-12 w-12 rounded-full border-2 border-solid border-gray-700 bg-white"
				aria-hidden="true"
			></div>
			<div class="flex w-3/5 flex-col justify-center">
				<a
					href={contactLinks.github}
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-200">Github</a
				>
				<p class="text-xl">louwelouwie</p>
			</div>
		</div>		<div class="flex flex-row items-center justify-center gap-3">
			<div
				class="aspect-square h-12 w-12 rounded-full border-2 border-solid border-gray-700 bg-white"
				aria-hidden="true"
			></div>
			<div class="flex w-3/5 flex-col justify-center">
				<a
					href={contactLinks.github}
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-200">Github</a
				>
				<p class="text-xl">louwelouwie</p>
			</div>
		</div>		<div class="flex flex-row items-center justify-center gap-3">
			<div
				class="aspect-square h-12 w-12 rounded-full border-2 border-solid border-gray-700 bg-white"
				aria-hidden="true"
			></div>
			<div class="flex w-3/5 flex-col justify-center">
				<a
					href={contactLinks.github}
					target="_blank"
					rel="noopener noreferrer"
					class="text-gray-200">Github</a
				>
				<p class="text-xl">louwelouwie</p>
			</div>
		</div>
	</nav>
</article>
