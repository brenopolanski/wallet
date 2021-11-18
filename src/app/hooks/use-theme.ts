import { Contracts } from "@payvo/sdk-profiles";
import { Theme } from "types";
import { setThemeSource, shouldUseDarkColors } from "utils/electron-utils";

export type ViewingModeType = "light" | "dark";

export const useTheme = () => {
	const theme: ViewingModeType = shouldUseDarkColors() ? "dark" : "light";
	const isDarkMode = theme === "dark";

	const setTheme = (theme: Theme) => {
		setThemeSource(theme);

		if (shouldUseDarkColors()) {
			document.body.classList.add("theme-dark");
			document.body.classList.remove("theme-light");
		} else {
			document.body.classList.add("theme-light");
			document.body.classList.remove("theme-dark");
		}
	};

	const setProfileTheme = (profile: Contracts.IProfile) => {
		const profileTheme = profile.appearance().get("theme");
		const hasDifferentTheme = shouldUseDarkColors() !== (profileTheme === "dark");

		/* istanbul ignore else */
		if (hasDifferentTheme || !document.body.classList.contains(`theme-${theme}`)) {
			setTheme(profileTheme as Theme);
		}
	};

	const resetTheme = () => setTheme("system");

	const resetProfileTheme = (profile: Contracts.IProfile) => {
		resetTheme();

		profile.settings().set(Contracts.ProfileSetting.Theme, shouldUseDarkColors() ? "dark" : "light");
	};

	return { isDarkMode, resetProfileTheme, resetTheme, setProfileTheme, setTheme, theme };
};
