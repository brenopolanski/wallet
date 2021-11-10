import { DropdownOption } from "app/components/Dropdown";
import { NavigationBarMenuItem } from "app/components/NavigationBar";
import { TFunction } from "react-i18next";

export const getNavigationMenu = (t: TFunction): NavigationBarMenuItem[] => [
	{
		mountPath: (profileId) => `/profiles/${profileId}/dashboard`,
		title: t("COMMON.PORTFOLIO"),
	},
	{
		mountPath: (profileId) => `/profiles/${profileId}/plugins`,
		title: t("COMMON.PLUGINS"),
	},
	{
		mountPath: (profileId) => `/profiles/${profileId}/exchange`,
		title: t("COMMON.EXCHANGE"),
	},
	{
		mountPath: (profileId) => `/profiles/${profileId}/news`,
		title: t("COMMON.NEWS"),
	},
];

export const getUserInfoActions = (t: TFunction): (DropdownOption & NavigationBarMenuItem)[] => [
	{
		label: t("COMMON.CONTACTS"),
		mountPath: (profileId) => `/profiles/${profileId}/contacts`,
		title: "contracts",
		value: "contacts",
	},
	{
		label: t("COMMON.VOTES"),
		mountPath: (profileId) => `/profiles/${profileId}/votes`,
		title: "votes",
		value: "votes",
	},
	{
		label: t("COMMON.SETTINGS"),
		mountPath: (profileId) => `/profiles/${profileId}/settings`,
		title: "settings",
		value: "settings",
	},
	{
		icon: "ArrowExternal",
		isExternal: true,
		label: t("COMMON.SUPPORT"),
		mountPath: () => "https://payvo.com/contact",
		title: "support",
		value: "support",
	},
	{
		label: t("COMMON.SIGN_OUT"),
		mountPath: () => `/`,
		title: "sign-out",
		value: "sign-out",
	},
];
