export const experience = [
	{
		organization: 'Gemini Embedded Technology',
		year: '2026',
		role: { en: 'Embedded software internship', nl: 'Stage embedded software' },
		description: {
			en: 'I built a bidirectional RF-to-UDP transceiver on the STM32H735G-DK as a prototype for a custom board. It relayed packets between an RF module over USART and a network over UDP. An HTTP page hosted on the device let users configure UDP recipients, and the LCD showed the network status.',
			nl: 'Ik bouwde op de STM32H735G-DK een bidirectionele RF-naar-UDP-transceiver als prototype voor een eigen printplaat. Het systeem stuurde pakketten door tussen een RF-module via USART en een netwerk via UDP. Via een HTTP-pagina op het apparaat konden gebruikers UDP-ontvangers instellen. Het lcd-scherm toonde de netwerkstatus.'
		},
		tools: ['C/C++', 'STM32Cube', 'CMake', 'lwIP']
	},
	{
		organization: 'ICT@school',
		year: '2025',
		role: { en: 'Software development internship', nl: 'Stage softwareontwikkeling' },
		description: {
			en: 'I built the REST API for an admin CMS and a .NET MAUI app for members. Organisations could publish events, news, and notifications. Members could sign in, join events, and see their organisation’s updates and messages.',
			nl: 'Ik bouwde de REST-API voor een beheer-CMS en een .NET MAUI-app voor leden. Organisaties konden evenementen, nieuws en meldingen publiceren. Leden konden inloggen, zich aanmelden voor evenementen en berichten en updates van hun organisatie bekijken.'
		},
		tools: ['C#', 'ASP.NET', 'Entity Framework Core', '.NET MAUI']
	}
] as const;

export const education = [
	{
		school: 'Astrum College',
		years: '2022–2026',
		programme: { en: 'Software development, MBO level 4', nl: 'Software developer, mbo niveau 4' }
	},
	{
		school: 'Candea College',
		years: '2017–2022',
		programme: { en: 'HAVO', nl: 'Havo' }
	}
] as const;

export const skillGroups = [
	{
		title: { en: 'Embedded systems', nl: 'Embedded systemen' },
		description: {
			en: 'Microcontroller firmware, serial communication, and networking.',
			nl: 'Firmware voor microcontrollers, seriële communicatie en netwerken.'
		},
		skills: ['C/C++', 'Embedded software', 'STM32', 'STM32Cube', 'CMake', 'lwIP', 'USART', 'UDP']
	},
	{
		title: { en: 'Web and mobile', nl: 'Web en mobiel' },
		description: {
			en: 'Web interfaces, REST APIs, and cross-platform mobile apps.',
			nl: 'Webinterfaces, REST-API’s en mobiele apps voor meerdere platformen.'
		},
		skills: [
			'C#',
			'ASP.NET',
			'Entity Framework Core',
			'.NET MAUI',
			'React',
			'Next.js',
			'SvelteKit',
			'TypeScript',
			'JavaScript',
			'HTML',
			'CSS',
			'Tailwind CSS',
			'Python',
			'Django'
		]
	},
	{
		title: { en: 'Games and 3D', nl: 'Games en 3D' },
		description: {
			en: 'Gameplay scripting, 3D modelling, and interactive scenes.',
			nl: 'Gameplay programmeren, 3D-modellering en interactieve scènes.'
		},
		skills: ['Luau', 'Roblox', 'Blender', 'Three.js']
	}
] as const;

export const projects = [
	{
		id: 'artisanBouwservice',
		title: 'Artisan Bouwservice',
		description: {
			en: 'I built a Next.js website for a construction and maintenance business. It gives customers an overview of the services and a way to get in touch.',
			nl: 'Ik bouwde met Next.js een website voor een bouw- en onderhoudsbedrijf. Klanten kunnen er de diensten bekijken en contact opnemen.'
		},
		tools: ['Next.js', 'React']
	},
	{
		id: 'monkeyEmpires',
		title: 'Monkey Empires',
		description: {
			en: 'I developed this Roblox game in Luau. I programmed the gameplay, modelled the buildings, accessories, and characters in Blender, and made the icons, UI, and animations. I used libraries for signals, data storage, and spring animations.',
			nl: 'Ik ontwikkelde deze Roblox-game in Luau. Ik programmeerde de gameplay, modelleerde de gebouwen, accessoires en personages in Blender en maakte de iconen, interface en animaties. Voor signalen, gegevensopslag en veeranimaties gebruikte ik bibliotheken.'
		},
		tools: ['Roblox', 'Luau', 'Blender']
	},
	{
		id: 'portfolio',
		title: '3D Portfolio',
		description: {
			en: 'I modelled the desk and its objects in Blender, built the interactive scene with Three.js, and used SvelteKit for the portfolio pages on the laptop and phone.',
			nl: 'Ik modelleerde het bureau en de objecten in Blender, bouwde de interactieve scène met Three.js en gebruikte SvelteKit voor de portfoliopagina’s op de laptop en telefoon.'
		},
		tools: ['SvelteKit', 'Three.js', 'Blender']
	}
] as const;
