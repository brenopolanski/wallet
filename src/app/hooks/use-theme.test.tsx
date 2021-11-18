import { Contracts } from "@payvo/sdk-profiles";
import { useTheme } from "app/hooks/use-theme";
import electron from "electron";
import { Theme } from "types";
import * as utils from "utils/electron-utils";
import { env, getDefaultProfileId } from "utils/testing-library";

describe("useTheme", () => {
	describe("theme", () => {
		it("should run with shouldUseDarkColors", () => {
			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => true);

			expect(useTheme().theme).toBe("dark");
		});

		it("should run without shouldUseDarkColors", () => {
			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation();

			expect(useTheme().theme).toBe("light");
		});
	});

	describe("isDarkMode", () => {
		it("should return true if dark mode", () => {
			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => true);

			expect(useTheme().isDarkMode).toBe(true);
		});

		it("should return false if not dark mode", () => {
			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => false);

			expect(useTheme().isDarkMode).toBe(false);
		});
	});

	describe("setTheme", () => {
		it("should set light theme", () => {
			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => true);

			expect(electron.remote.nativeTheme.themeSource).toBe("system");

			useTheme().setTheme("light");

			expect(electron.remote.nativeTheme.themeSource).toBe("light");
		});

		it("should set dark theme", () => {
			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => true);
			useTheme().setTheme("dark");

			expect(electron.remote.nativeTheme.themeSource).toBe("dark");
		});
	});

	describe("setProfileTheme", () => {
		it("should set theme from profile settings", async () => {
			const profile = env.profiles().findById(getDefaultProfileId());
			await env.profiles().restore(profile);

			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => true);
			useTheme().setTheme("dark");

			expect(electron.remote.nativeTheme.themeSource).toBe("dark");

			useTheme().setProfileTheme(profile);

			expect(electron.remote.nativeTheme.themeSource).toBe("light");
		});

		it("should not set theme from profile settings", async () => {
			const profile = env.profiles().findById(getDefaultProfileId());
			await env.profiles().restore(profile);

			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => false);
			useTheme().setTheme("dark");

			expect(electron.remote.nativeTheme.themeSource).toBe("dark");

			useTheme().setProfileTheme(profile);

			expect(electron.remote.nativeTheme.themeSource).toBe("dark");
		});
	});

	describe("resetProfileTheme", () => {
		it.each([
			["light", "dark"],
			["dark", "light"],
		])("should reset profile %s theme to defaults", async (profileTheme, systemTheme) => {
			const profile = env.profiles().findById(getDefaultProfileId());
			await env.profiles().restore(profile);

			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => systemTheme === "dark");

			profile.settings().set(Contracts.ProfileSetting.Theme, profileTheme);
			useTheme().setTheme(profileTheme as Theme);

			expect(electron.remote.nativeTheme.themeSource).toBe(profileTheme);

			useTheme().resetProfileTheme(profile);

			expect(electron.remote.nativeTheme.themeSource).toBe("system");
			expect(profile.appearance().get("theme")).toBe(systemTheme);
		});
	});

	describe("resetTheme", () => {
		it("should reset theme to defaults", () => {
			jest.spyOn(utils, "shouldUseDarkColors").mockImplementation(() => true);
			useTheme().setTheme("dark");

			expect(electron.remote.nativeTheme.themeSource).toBe("dark");

			useTheme().resetTheme();

			expect(electron.remote.nativeTheme.themeSource).toBe("system");
		});
	});
});
