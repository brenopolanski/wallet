import { Contracts } from "@payvo/sdk-profiles";
import { IPluginController, PluginController, PluginManager } from "plugins/core";
import { PluginAPI } from "plugins/types";
import { env } from "utils/testing-library";

import { StorePluginService } from "./StorePluginService";

const config = { "desktop-wallet": { permissions: ["STORE"] }, name: "test", version: "1.1" };

describe("StorePluginService", () => {
	let profile: Contracts.IProfile;
	let manager: PluginManager;
	let ctrl: IPluginController;

	beforeEach(() => {
		profile = env.profiles().first();

		manager = new PluginManager();

		manager.services().register([new StorePluginService()]);
		manager.services().boot();
	});

	it("should persist values", () => {
		const fixture = (api: PluginAPI) => {
			api.store().data().set("theme", "dark");
			api.store().persist();
		};

		ctrl = new PluginController(config, fixture);
		ctrl.enable(profile);

		manager.plugins().push(ctrl);
		manager.plugins().runAllEnabled(profile);

		expect(profile.data().get(`plugins.${ctrl.config().id()}.store`)).toStrictEqual({ theme: "dark" });
	});

	it("should restore values", () => {
		let result;

		const fixture = (api: PluginAPI) => {
			const current = api.store().data().get("theme");
			result = current;
		};

		ctrl = new PluginController(config, fixture);
		ctrl.enable(profile);

		manager.plugins().push(ctrl);
		manager.plugins().runAllEnabled(profile);

		expect(result).toBe("dark");
	});
});
