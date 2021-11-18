import { Contracts } from "@payvo/sdk-profiles";
import { LaunchPluginService } from "plugins";
import { PluginManagerProvider } from "plugins/context/PluginManagerProvider";
import { PluginController, PluginManager } from "plugins/core";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render, screen } from "utils/testing-library";

import { PluginView } from "./PluginView";

describe("Plugin View", () => {
	let manager: PluginManager;
	let profile: Contracts.IProfile;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		manager = new PluginManager();
		manager.services().register([new LaunchPluginService()]);
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it("should render plugin content", async () => {
		const plugin = new PluginController(
			{ "desktop-wallet": { permissions: ["LAUNCH"] }, name: "test-plugin" },
			(api) => api.launch().render(<h1>My Plugin View</h1>),
		);

		manager.plugins().push(plugin);

		plugin.enable(profile, { autoRun: true });

		const { container } = render(
			<Route path="/profiles/:profileId/plugins/view">
				<PluginManagerProvider manager={manager} services={[]}>
					<PluginView />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/view?pluginId=${plugin.config().id()}`],
				withPluginProvider: false,
			},
		);

		await screen.findByText("My Plugin View");

		expect(container).toMatchSnapshot();

		manager.plugins().removeById(plugin.config().id(), profile);
	});

	it.each(["message", "stack"])("should render error boundary with error %s", (type) => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => null);

		const Component = () => {
			const error = new Error("error");

			if (type === "stack") {
				error.stack = "stacktrace";
			} else {
				error.stack = undefined;
			}

			throw error;
		};

		const plugin = new PluginController(
			{ "desktop-wallet": { permissions: ["LAUNCH"] }, name: "test-plugin" },
			(api) => api.launch().render(<Component />),
		);

		manager.plugins().push(plugin);

		plugin.enable(profile, { autoRun: true });

		const { container } = render(
			<Route path="/profiles/:profileId/plugins/view">
				<PluginManagerProvider manager={manager} services={[]}>
					<PluginView />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/view?pluginId=${plugin.config().id()}`],
			},
		);

		expect(container).toHaveTextContent("An error occurred!");
		expect(container).toMatchSnapshot();

		manager.plugins().removeById(plugin.config().id(), profile);

		consoleSpy.mockRestore();
	});
});
