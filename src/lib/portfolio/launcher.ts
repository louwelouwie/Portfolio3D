import cvUrl from '#lib/assets/ChrisLouwerseCV.pdf?url';
import { contactDestination } from '#lib/contact.js';
import { copy, type Language } from '#lib/language.js';
import { portfolioApps, type PortfolioAppId } from './apps.js';

export const projectLinks = {
	artisanBouwservice: 'https://artisanbouwservice.nl/',
	// Set this to the direct Roblox experience URL.
	monkeyEmpires: ''
};

type ShortcutId = 'github' | 'linkedin' | 'cv' | 'email' | keyof typeof projectLinks;

export type LauncherItem =
	| { kind: 'app'; id: PortfolioAppId; label: string }
	| { kind: 'shortcut'; id: ShortcutId; label: string; href?: string; download?: string };

export function launcherItems(language: Language): LauncherItem[] {
	const t = copy[language];
	return [
		...portfolioApps.map((id) => ({ kind: 'app' as const, id, label: t[id] })),
		{ kind: 'shortcut', id: 'github', label: 'GitHub', href: contactDestination('github') },
		{
			kind: 'shortcut',
			id: 'linkedin',
			label: 'LinkedIn',
			href: contactDestination('linkedin')
		},
		{
			kind: 'shortcut',
			id: 'cv',
			label: t.cvShortcut,
			href: cvUrl,
			download: 'ChrisLouwerseCV.pdf'
		},
		{
			kind: 'shortcut',
			id: 'email',
			label: t.emailShortcut,
			href: contactDestination('email')
		},
		{
			kind: 'shortcut',
			id: 'artisanBouwservice',
			label: 'Artisan Bouwservice',
			href: projectLinks.artisanBouwservice
		},
		{
			kind: 'shortcut',
			id: 'monkeyEmpires',
			label: 'Monkey Empires',
			href: projectLinks.monkeyEmpires || undefined
		}
	];
}
