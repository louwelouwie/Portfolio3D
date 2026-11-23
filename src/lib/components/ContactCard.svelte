<!-- Chris Louwerse 23/11/2026 -->

<script lang="ts">
	import { contactLinks } from '#lib/contact.js';
	import { socialIconPaths } from '#lib/socialIcons.js';

	let { interactive }: { interactive: boolean } = $props();

	const socials = [
		{
			name: 'GitHub',
			href: contactLinks.github,
			icon: socialIconPaths.github
		},
		{
			name: 'LinkedIn',
			href: contactLinks.linkedin,
			icon: socialIconPaths.linkedin
		},
		{
			name: 'WhatsApp',
			href: contactLinks.whatsapp,
			icon: socialIconPaths.whatsapp
		},
		{
			name: 'Email',
			href: contactLinks.email,
			icon: socialIconPaths.email
		}
	];
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
		class="grid h-3/5 grid-cols-2 p-4 gap-2 items-center justify-center border-t-3 bg-gray-950"
		aria-label="Contact links"
	>
		{#each socials as { name, href, icon } (name)}
			{@const url = new URL(href)}
			{@const linkText = url.pathname.split('/').filter(Boolean).at(-1) ?? href}
			<div class="flex min-w-0 flex-row items-center justify-center gap-3">
				<div
					class="grid size-12 shrink-0 place-items-center rounded-full border-2 border-gray-700 bg-white text-gray-950"
				>
					<svg viewBox="0 0 16 16" class="size-6" fill="currentColor" aria-hidden="true">
						<path d={icon} />
					</svg>
				</div>
				<div class="flex w-2/3 min-w-0 flex-col justify-center">
					<p class="text-sm text-gray-200">{name}</p>
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						{href}
						target={url.protocol === 'mailto:' ? undefined : '_blank'}
						rel="noopener noreferrer"
						aria-label={`${name} — ${linkText}`}
						title={linkText}
						class="truncate text-base underline-offset-2 hover:underline focus-visible:underline"
						>{linkText}</a
					>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</div>
			</div>
		{/each}
	</nav>
</article>
