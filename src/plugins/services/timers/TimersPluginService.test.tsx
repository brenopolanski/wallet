import { Contracts } from "@payvo/sdk-profiles";
import { IPluginController, PluginController, PluginManager } from "plugins/core";
import { PluginAPI } from "plugins/types";
import { act } from "react-dom/test-utils";
import { env, waitFor } from "utils/testing-library";

import { TimersPluginService } from "./TimersPluginService";

const config = { "desktop-wallet": { permissions: ["TIMERS"] }, name: "test", version: "1.1" };

describe("TimersPluginService", () => {
	let profile: Contracts.IProfile;
	let manager: PluginManager;
	let ctrl: IPluginController;

	beforeEach(() => {
		profile = env.profiles().first();

		manager = new PluginManager();

		manager.services().register([new TimersPluginService()]);
		manager.services().boot();
	});

	it("should run periodic", async () => {
		jest.useFakeTimers();

		let test = 0;
		const fixture = (api: PluginAPI) => {
			const timer = api.timers().setInterval(() => (test = test + 1), 200);
			const timer2 = api.timers().setTimeout(() => (test = 300), 100);
			api.timers().clearTimeout(timer2);
			api.timers().setTimeout(() => api.timers().clearInterval(timer), 1000);
		};

		manager.plugins().push(ctrl);

		ctrl = new PluginController(config, fixture);
		ctrl.enable(profile, { autoRun: true });

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		await waitFor(() => expect(test).toBe(5));

		jest.useRealTimers();
	});
});
