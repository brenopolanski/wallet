import { renderHook } from "@testing-library/react-hooks";
import { translations } from "domains/plugin/i18n";

import { usePluginStatus } from "./use-plugin-status";

describe("#usePluginStatus", () => {
	it("should return `not installed` status", () => {
		const { result } = renderHook(() => usePluginStatus());
		const status = result.current.getPluginStatus({ isEnabled: false, isInstalled: false });

		expect(status).toBe(translations.STATUS.NOT_INSTALLED);
	});

	it("should render `disabled` status", () => {
		const { result } = renderHook(() => usePluginStatus());
		const status = result.current.getPluginStatus({ isEnabled: false, isInstalled: true });

		expect(status).toBe(translations.STATUS.DISABLED);
	});

	it("should render `enabled` status", () => {
		const { result } = renderHook(() => usePluginStatus());
		const status = result.current.getPluginStatus({ isEnabled: true, isInstalled: true });

		expect(status).toBe(translations.STATUS.ENABLED);
	});
});
