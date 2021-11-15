export const pluginData = {
	about: "Use the ARK Explorer to get full visibility of critical data from the ARK network. Data such as the latest blocks, wallet addresses and transactions. Plus monitor delegate status, their position and more.",
	author: "Payvo",
	averageRating: "4.6",
	category: "Utility",
	name: "ARK Explorer",
	permissions: ["Embedded Webpages", "API Requests", "Access to Profiles"],
	screenshots: [1, 2, 3],
	size: "4.2",
	url: "github.com",
	version: "1.3.8",
} as const;

export const plugins = [
	{
		author: "Payvo",
		category: "Utility",
		description: "This is a description",
		id: 0,
		isOfficial: true,
		name: "ARK Explorer",
		rating: 4.6,
		version: "1.3.8",
	},
	{
		author: "Breno Polanski",
		category: "Utility",
		description: "This is a description",
		id: 1,
		name: "Animal Avatars",
		rating: 4.6,
		version: "1.3.8",
	},
	{
		author: "ChangeNOW",
		category: "Other",
		description: "This is a description",
		id: 2,
		name: "ChangeNOW Plugin",
		rating: 4.8,
		version: "1.3.8",
	},
	{
		author: "Delegate Fun",
		category: "Game",
		description: "This is a description",
		id: 4,
		name: "Bold Ninja",
		rating: 4.9,
		version: "2.0.0",
	},
] as const;

export const PLUGIN_CATEGORIES = ["gaming", "utility", "other"] as const;
