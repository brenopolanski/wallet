import { Contracts } from "@payvo/sdk-profiles";
import { PluginController } from "plugins/core/plugin-controller";
import { PluginServiceData } from "plugins/core/plugin-service";
import { EventsPluginService } from "plugins/services";
import { env, getDefaultProfileId } from "utils/testing-library";

import { isPluginEnabled, isServiceDefinedInConfig } from "./plugin-permission";

describe("Plugin Permissions", () => {
	let profile: Contracts.IProfile;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should log plugin not enabled", () => {
		const plugin = new PluginController({ name: "plugin-test" }, () => void 0);
		const service = new PluginServiceData(new EventsPluginService());
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		const protectedFunction = isPluginEnabled({ plugin, profile, service })("result");
		protectedFunction();

		expect(consoleSpy).toHaveBeenCalledWith("The plugin plugin-test is not enabled by the current profile.");
	});

	it("should log service not defined", () => {
		const plugin = new PluginController({ name: "plugin-test" }, () => void 0);
		const service = new PluginServiceData(new EventsPluginService());
		const consoleSpy = jest.spyOn(console, "error").mockImplementation();

		const protectedFunction = isServiceDefinedInConfig({ plugin, profile, service })("result");
		protectedFunction();

		expect(consoleSpy).toHaveBeenCalledWith("The plugin plugin-test did not define EVENTS its permissions.");
	});
});
