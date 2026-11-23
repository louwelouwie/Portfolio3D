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
		lampToLight: 'Turn lamp off',
		lampToDark: 'Turn lamp on',
		laptopZoom: 'View portfolio',
		phoneZoom: 'View portfolio',
		embeddedZoom: 'Play game',
		headphonesOn: 'Turn sound on',
		headphonesOff: 'Turn sound off',
		cardView: 'View contact details',
		coffeeSip: 'Take a sip',
		printerPrint: 'Print CV',
		cvPreview: 'CV preview',
		downloadCv: 'Download CV',
		phoneNavigation: 'Phone navigation',
		phoneHistory: 'History',
		phoneHome: 'Home',
		phoneBack: 'Back',
		phoneNoHistory: 'No apps opened yet',
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
		runnerTitle: 'Desk Dino',
		runnerIntro: 'Jump over obstacles and keep going.',
		runnerContinue: 'Press to continue',
		runnerPaused: 'Paused',
		runnerOver: 'Game over',
		runnerRetry: 'Press to retry',
		runnerScore: 'Score',
		runnerBest: 'Best',
		runnerControls: 'Tap, click, Space, or Up Arrow to jump.',
		dragHint: 'drag to move',
		portfolio: 'Portfolio',
		openPortfolio: 'Open portfolio',
		closePortfolio: 'Close portfolio',
		closeGame: 'Close game',
		minimizePortfolio: 'Minimize portfolio',
		restorePortfolio: 'Restore portfolio window',
		maximizePortfolio: 'Maximize portfolio window',
		navigationLabel: 'Portfolio sections',
		about: 'About',
		skills: 'Skills',
		projects: 'Projects',
		welcome: 'Welcome',
		welcomeBody:
			'I build web experiences and software. This portfolio is a work in progress, starting with the interactive 3D desk you just explored.',
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
		lampToLight: 'Zet lamp uit',
		lampToDark: 'Zet lamp aan',
		laptopZoom: 'Bekijk portfolio',
		phoneZoom: 'Bekijk portfolio',
		embeddedZoom: 'Speel game',
		headphonesOn: 'Zet geluid aan',
		headphonesOff: 'Zet geluid uit',
		cardView: 'Bekijk contactgegevens',
		coffeeSip: 'Neem een slok',
		printerPrint: 'Print cv',
		cvPreview: 'Cv bekijken',
		downloadCv: 'Download cv',
		phoneNavigation: 'Telefoonnavigatie',
		phoneHistory: 'Geschiedenis',
		phoneHome: 'Startscherm',
		phoneBack: 'Terug',
		phoneNoHistory: 'Nog geen apps geopend',
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
		runnerTitle: 'Bureau Dino',
		runnerIntro: 'Spring over obstakels en blijf doorgaan.',
		runnerContinue: 'Druk om verder te gaan',
		runnerPaused: 'Gepauzeerd',
		runnerOver: 'Spel afgelopen',
		runnerRetry: 'Druk om opnieuw te spelen',
		runnerScore: 'Score',
		runnerBest: 'Record',
		runnerControls: 'Tik, klik, druk op Spatie of Pijl omhoog om te springen.',
		dragHint: 'sleep om te verplaatsen',
		portfolio: 'Portfolio',
		openPortfolio: 'Open portfolio',
		closePortfolio: 'Sluit portfolio',
		closeGame: 'Sluit spel',
		minimizePortfolio: 'Minimaliseer portfolio',
		restorePortfolio: 'Herstel portfoliovenster',
		maximizePortfolio: 'Maximaliseer portfoliovenster',
		navigationLabel: 'Portfoliosecties',
		about: 'Over mij',
		skills: 'Vaardigheden',
		projects: 'Projecten',
		welcome: 'Welkom',
		welcomeBody:
			'Ik bouw webervaringen en software. Dit portfolio is nog in ontwikkeling, te beginnen met het interactieve 3D-bureau dat je net hebt bekeken.',
		aboutHeading: 'Over mij',
		aboutBody:
			'Ik ben Chris Louwerse, een softwareontwikkelaar met interesse in webontwikkeling en interactieve interfaces. Hier deel ik mijn projecten en wat ik onderweg leer.',
		skillsHeading: 'Vaardigheden in dit project',
		projectTitle: '3D Portfolio',
		projectBody:
			'Een interactief portfolio-experiment gebouwd met SvelteKit en Three.js. Het laptopscherm toont deze portfoliopagina.'
	}
} as const;
