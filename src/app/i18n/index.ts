import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Helpers
import { buildTranslations } from "./helpers";

const defaultNS = "translation";

const resources = {
	en: {
		translation: buildTranslations(),
	},
};

// eslint-disable-next-line
i18n.use(initReactI18next).init({
	defaultNS,
	lng: "en",
	ns: [defaultNS],
	resources,
});

export { defaultNS, i18n, resources };
