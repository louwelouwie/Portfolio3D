// Replace the remaining example destinations before publishing the card.
export const contactLinks = {
	github: 'https://github.com/louwelouwie',
	linkedin: 'https://www.linkedin.com/in/ChrisLouwerse',
	whatsapp: 'https://wa.me/0658886190',
	email: 'mailto:c.louwerse35@gmail.com'
} as const;

export function contactDestination(method: keyof typeof contactLinks) {
	const href = contactLinks[method];
	return href.endsWith('/your-profile') || href.endsWith('/your-number') ? undefined : href;
}
