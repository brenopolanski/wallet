import { renderHook } from "@testing-library/react-hooks";
import { translations } from "domains/setting/i18n";
import { env } from "utils/testing-library";

import { AppearanceSettingsState } from "./Appearance.contracts";
import { useAppearanceItems, useAppearanceSettings } from "./Appearance.helpers";

describe("Appearance.helpers", () => {
	describe("useAppearanceItems", () => {
		it("should return items to render in the form", () => {
			const { result } = renderHook(() => useAppearanceItems());

			expect(result.current).toHaveLength(5);

			expect(result.current[0].label).toBe(translations.APPEARANCE.OPTIONS.ACCENT_COLOR.TITLE);
			expect(result.current[1].label).toBe(translations.APPEARANCE.OPTIONS.VIEWING_MODE.TITLE);
			expect(result.current[2].label).toBe(translations.APPEARANCE.OPTIONS.LATEST_TRANSACTIONS.TITLE);
			expect(result.current[3].label).toBe(translations.APPEARANCE.OPTIONS.WALLET_NAMING.TITLE);
			expect(result.current[4].label).toBe(translations.APPEARANCE.OPTIONS.EXPANDED_TABLES.TITLE);
		});
	});

	describe("useAppearanceSettings", () => {
		it("should return get and set functions for the appearance settings", () => {
			const profile = env.profiles().create("empty profile");

			const { result } = renderHook(() => useAppearanceSettings(profile));

			expect(typeof result.current.getValues).toBe("function");
			expect(typeof result.current.setValues).toBe("function");

			const testValues: AppearanceSettingsState = {
				accentColor: "blue",
				dashboardTransactionHistory: false,
				useExpandedTables: false,
				useNetworkWalletNames: false,
				viewingMode: "light",
			};

			expect(result.current.getValues()).not.toStrictEqual(testValues);

			result.current.setValues(testValues);

			expect(result.current.getValues()).toStrictEqual(testValues);
		});
	});
});
