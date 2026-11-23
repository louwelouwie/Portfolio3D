export const portfolioApps = ['skills', 'about', 'contact', 'projects'] as const;
export type PortfolioAppId = (typeof portfolioApps)[number];
