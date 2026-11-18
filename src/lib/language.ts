export type Language = 'en' | 'nl';

export const languageStorageKey = 'portfolio-language';

export function readLanguage(): Language {
	try {
		return localStorage.getItem(languageStorageKey) === 'nl' ? 'nl' : 'en';
	} catch {
		return 'en';
	}
}

export function saveLanguage(language: Language) {
	try {
		localStorage.setItem(languageStorageKey, language);
	} catch {
		// The current page can still change language without storage.
	}
}

export const copy = {
	en: {
		role: 'Software developer',
		heroLine: 'I build software and interactive web experiences.',
		heroDescription: 'This is where I share projects, experiments, and what I learn along the way.',
		lampToLight: 'Click lamp for light mode',
		lampToDark: 'Click lamp for dark mode',
		laptopZoom: 'Click laptop to zoom in',
		openLaptop: 'Open laptop',
		backToDesk: 'Back to desk',
		lightMode: 'Light mode',
		darkMode: 'Dark mode',
		soundOn: 'Sound on',
		soundOff: 'Sound off',
		changeLanguage: 'Switch to Dutch',
		quickControls: 'Quick controls',
		objectControls: 'Explore objects',
		sceneError: 'The 3D scene could not load.',
		openPortfolioPage: 'Open the portfolio page',
		trash: 'Recycle bin',
		game: 'Game',
		runnerTitle: 'Desk Dino',
		runnerIntro: 'Jump over obstacles and keep going.',
		runnerContinue: 'Press to continue',
		runnerPaused: 'Paused',
		runnerOver: 'Game over',
		runnerRetry: 'Press to retry',
		runnerScore: 'Score',
		runnerBest: 'Best',
		runnerControls: 'Tap, click, Space, or Up Arrow to jump.',
		backToDesktop: 'Back to desktop',
		dragHint: 'drag to move',
		portfolio: 'Portfolio',
		openPortfolio: 'Open portfolio',
		closePortfolio: 'Close portfolio',
		minimizePortfolio: 'Minimize portfolio',
		restorePortfolio: 'Restore portfolio window',
		maximizePortfolio: 'Maximize portfolio window',
		navigationLabel: 'Portfolio sections',
		about: 'About',
		skills: 'Skills',
		projects: 'Projects',
		welcome: 'Welcome',
		welcomeBody:
			'I build web experiences and software. This portfolio is a work in progress, starting with the interactive 3D laptop you just explored.',
		aboutHeading: 'About me',
		aboutBody:
			"I'm Chris Louwerse, a software developer interested in web development and interactive interfaces. I'm using this space to share the projects I build and what I learn along the way.",
		skillsHeading: 'Skills used here',
		projectTitle: '3D Portfolio',
		projectBody:
			'An interactive portfolio experiment built with SvelteKit and Three.js. The laptop screen contains this portfolio page.'
	},
	nl: {
		role: 'Softwareontwikkelaar',
		heroLine: 'Ik bouw software en interactieve webervaringen.',
		heroDescription: 'Hier deel ik projecten, experimenten en wat ik onderweg leer.',
		lampToLight: 'Klik op de lamp voor lichte modus',
		lampToDark: 'Klik op de lamp voor donkere modus',
		laptopZoom: 'Klik op de laptop om in te zoomen',
		openLaptop: 'Open laptop',
		backToDesk: 'Terug naar bureau',
		lightMode: 'Lichte modus',
		darkMode: 'Donkere modus',
		soundOn: 'Geluid aan',
		soundOff: 'Geluid uit',
		changeLanguage: 'Switch to English',
		quickControls: 'Snelle bediening',
		objectControls: 'Objecten verkennen',
		sceneError: 'De 3D-scène kon niet worden geladen.',
		openPortfolioPage: 'Open de portfoliopagina',
		trash: 'Prullenbak',
		game: 'Spel',
		runnerTitle: 'Bureau Dino',
		runnerIntro: 'Spring over obstakels en blijf doorgaan.',
		runnerContinue: 'Druk om verder te gaan',
		runnerPaused: 'Gepauzeerd',
		runnerOver: 'Spel afgelopen',
		runnerRetry: 'Druk om opnieuw te spelen',
		runnerScore: 'Score',
		runnerBest: 'Record',
		runnerControls: 'Tik, klik, druk op Spatie of Pijl omhoog om te springen.',
		backToDesktop: 'Terug naar bureaublad',
		dragHint: 'sleep om te verplaatsen',
		portfolio: 'Portfolio',
		openPortfolio: 'Open portfolio',
		closePortfolio: 'Sluit portfolio',
		minimizePortfolio: 'Minimaliseer portfolio',
		restorePortfolio: 'Herstel portfoliovenster',
		maximizePortfolio: 'Maximaliseer portfoliovenster',
		navigationLabel: 'Portfoliosecties',
		about: 'Over mij',
		skills: 'Vaardigheden',
		projects: 'Projecten',
		welcome: 'Welkom',
		welcomeBody:
			'Ik bouw webervaringen en software. Dit portfolio is nog in ontwikkeling, te beginnen met de interactieve 3D-laptop die je net hebt bekeken.',
		aboutHeading: 'Over mij',
		aboutBody:
			'Ik ben Chris Louwerse, een softwareontwikkelaar met interesse in webontwikkeling en interactieve interfaces. Hier deel ik mijn projecten en wat ik onderweg leer.',
		skillsHeading: 'Vaardigheden in dit project',
		projectTitle: '3D Portfolio',
		projectBody:
			'Een interactief portfolio-experiment gebouwd met SvelteKit en Three.js. Het laptopscherm toont deze portfoliopagina.'
	}
} as const;
