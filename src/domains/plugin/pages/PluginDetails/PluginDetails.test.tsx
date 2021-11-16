import { Contracts } from "@payvo/profiles";
import userEvent from "@testing-library/user-event";
import { buildTranslations } from "app/i18n/helpers";
import { toasts } from "app/services";
import { ipcRenderer } from "electron";
import nock from "nock";
import { LaunchPluginService, PluginController } from "plugins";
import { PluginManagerProvider, usePluginManagerContext } from "plugins/context/PluginManagerProvider";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, pluginManager, render, screen, waitFor, within } from "utils/testing-library";

import { PluginDetails } from "./PluginDetails";

const translations = buildTranslations();

describe("PluginDetails", () => {
	let profile: Contracts.IProfile;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it("should show configuration for plugins from npm", async () => {
		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		const { container } = render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=@dated/delegate-calculator-wallet-plugin`],
				withPluginProvider: false,
			},
		);

		await waitFor(() => expect(screen.getByTestId("PluginSpecs__size")).toHaveTextContent("N/A"));

		userEvent.click(screen.getByText("Fetch Packages"));

		await screen.findByText("ARK Delegate Calculator");

		await waitFor(() => expect(screen.getByTestId("PluginSpecs__size")).toHaveTextContent("123 kB"));

		expect(container).toMatchSnapshot();
	});

	it("should render properly", async () => {
		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["other"] }, name: "test-plugin" },
			() => void 0,
		);

		pluginManager.plugins().push(plugin);

		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		const { container } = render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=${plugin.config().id()}`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Packages"));

		await screen.findByText("Test Plugin");

		expect(container).toMatchSnapshot();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should render properly for remote package", async () => {
		nock("https://github.com/")
			.get("/arkecosystem/remote-plugin/raw/master/package.json")
			.reply(200, { keywords: ["@payvo", "wallet-plugin"], name: "remote-plugin" });

		const FetchComponent = () => {
			const { fetchLatestPackageConfiguration } = usePluginManagerContext();
			return (
				<button
					onClick={() => fetchLatestPackageConfiguration("https://github.com/arkecosystem/remote-plugin")}
				>
					Fetch Package
				</button>
			);
		};

		const { container } = render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=remote-plugin`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Package"));

		await screen.findByText("Remote Plugin");

		expect(container).toMatchSnapshot();
	});

	it("should report plugin", async () => {
		const ipcRendererMock = jest.spyOn(ipcRenderer, "send").mockImplementation();

		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["other"] }, name: "test-plugin" },
			() => void 0,
		);

		pluginManager.plugins().push(plugin);

		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		const { container } = render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=${plugin.config().id()}`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Packages"));

		await screen.findByText("Test Plugin");

		expect(container).toMatchSnapshot();

		userEvent.click(screen.getByTestId("PluginHeader__button--report"));

		expect(ipcRendererMock).toHaveBeenCalledWith(
			"open-external",
			"https://payvo.com/contact?subject=desktop_wallet_plugin_report&plugin_id=test-plugin&plugin_version=0.0.0",
		);

		ipcRendererMock.mockRestore();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should open the plugin view", async () => {
		const plugin = new PluginController(
			{ "desktop-wallet": { permissions: ["LAUNCH"] }, name: "test-plugin" },
			(api) => api.launch().render(<h1>Test</h1>),
		);
		pluginManager.services().register([new LaunchPluginService()]);
		pluginManager.plugins().push(plugin);
		plugin.enable(profile, { autoRun: true });

		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		const { history } = render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=${plugin.config().id()}`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Packages"));

		await screen.findByText("Test Plugin");

		userEvent.click(screen.getByTestId("PluginHeader__button--launch"));

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/plugins/view`);
		expect(history.location.search).toBe(`?pluginId=${plugin.config().id()}`);

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should enable package from header", async () => {
		const toastSpy = jest.spyOn(toasts, "success").mockImplementation();

		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["other"] }, name: "test-plugin" },
			() => void 0,
		);

		pluginManager.plugins().push(plugin);

		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=${plugin.config().id()}`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Packages"));

		await screen.findByText("Test Plugin");

		userEvent.click(within(screen.getByTestId("plugin-details__header")).getByTestId("dropdown__toggle"));
		userEvent.click(screen.getByText(translations.COMMON.ENABLE));

		await waitFor(() => expect(plugin.isEnabled(profile)).toBe(true));

		expect(toastSpy).toHaveBeenCalledWith(
			translations.PLUGINS.ENABLE_SUCCESS.replace("{{name}}", plugin.config().title() as string),
		);

		pluginManager.plugins().removeById(plugin.config().id(), profile);

		toastSpy.mockRestore();
	});

	it("should fail to enable package", async () => {
		const toastSpy = jest.spyOn(toasts, "error").mockImplementation();

		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["other"] }, name: "test-plugin" },
			{ incompatible: true },
		);

		pluginManager.plugins().push(plugin);

		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=${plugin.config().id()}`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Packages"));

		await screen.findByText("Test Plugin");

		userEvent.click(within(screen.getByTestId("plugin-details__header")).getByTestId("dropdown__toggle"));
		userEvent.click(screen.getByText(translations.COMMON.ENABLE));

		await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(expect.stringMatching(/Failed to enable/)));

		pluginManager.plugins().removeById(plugin.config().id(), profile);

		toastSpy.mockRestore();
	});

	it("should disable package from header", async () => {
		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["other"] }, name: "test-plugin" },
			() => void 0,
		);

		pluginManager.plugins().push(plugin);
		plugin.enable(profile, { autoRun: true });

		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=${plugin.config().id()}`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Packages"));

		await screen.findByText("Test Plugin");

		userEvent.click(within(screen.getByTestId("plugin-details__header")).getByTestId("dropdown__toggle"));
		userEvent.click(screen.getByText(translations.COMMON.DISABLE));

		await waitFor(() => expect(plugin.isEnabled(profile)).toBe(false));
		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should remove package", async () => {
		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["other"] }, name: "test-plugin" },
			() => void 0,
		);

		pluginManager.plugins().push(plugin);

		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		const { history } = render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=${plugin.config().id()}`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Packages"));

		await screen.findByText("Test Plugin");

		userEvent.click(within(screen.getByTestId("plugin-details__header")).getByTestId("dropdown__toggle"));
		userEvent.click(screen.getByText(translations.COMMON.DELETE));

		const invokeMock = jest.spyOn(ipcRenderer, "invoke").mockResolvedValue([]);
		userEvent.click(screen.getByTestId("PluginUninstall__submit-button"));

		await waitFor(() => expect(pluginManager.plugins().findById(plugin.config().id())).toBeUndefined());
		await waitFor(() => expect(history.location.pathname).toBe(`/profiles/${profile.id()}/plugins`));

		invokeMock.mockRestore();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should close remove confirmation", async () => {
		const plugin = new PluginController(
			{ "desktop-wallet": { categories: ["other"] }, name: "test-plugin" },
			() => void 0,
		);

		pluginManager.plugins().push(plugin);

		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=${plugin.config().id()}`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Packages"));

		await screen.findByText("Test Plugin");

		userEvent.click(within(screen.getByTestId("plugin-details__header")).getByTestId("dropdown__toggle"));
		userEvent.click(screen.getByText(translations.COMMON.DELETE));

		const invokeMock = jest.spyOn(ipcRenderer, "invoke").mockResolvedValue([]);
		userEvent.click(screen.getByTestId("PluginUninstall__cancel-button"));
		await waitFor(() => expect(screen.queryByTestId("PluginUninstallConfirmation")).not.toBeInTheDocument());

		invokeMock.mockRestore();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should install package with error", async () => {
		jest.spyOn(ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:download") {
				throw new Error("Plugin not found");
			}
		});

		nock("https://github.com/")
			.get("/arkecosystem/remote-plugin/raw/master/package.json")
			.reply(200, { name: "remote-plugin" });

		const FetchComponent = () => {
			const { fetchLatestPackageConfiguration } = usePluginManagerContext();
			return (
				<button
					onClick={() => fetchLatestPackageConfiguration("https://github.com/arkecosystem/remote-plugin")}
				>
					Fetch
				</button>
			);
		};

		render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [
					`/profiles/${profile.id()}/plugins/details?pluginId=remote-plugin&repositoryURL=https://github.com/arkecosystem/remote-plugin`,
				],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch"));

		await screen.findByText("Remote Plugin");

		userEvent.click(screen.getByTestId("PluginHeader__button--install"));

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.PLUGINS.MODAL_INSTALL_PLUGIN.DESCRIPTION,
		);

		const toastSpy = jest.spyOn(toasts, "error");

		userEvent.click(screen.getByTestId("InstallPlugin__allow-button"));

		await waitFor(() => {
			expect(toastSpy).toHaveBeenCalledWith(expect.stringMatching(/Failed to download/));
		});
	});

	it("should install package", async () => {
		const ipcRendererSpy = jest.spyOn(ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:loader-fs.find") {
				return {
					config: { keywords: ["@payvo", "wallet-plugin"], name: "remote-plugin", version: "0.0.1" },
					dir: "/plugins/remote-plugin",
					source: () => void 0,
					sourcePath: "/plugins/remote-plugin/index.js",
				};
			}

			if (channel === "plugin:download") {
				return "/plugins/remote-plugin";
			}
		});

		nock("https://github.com/")
			.get("/arkecosystem/remote-plugin/raw/master/package.json")
			.reply(200, { name: "remote-plugin" });

		const FetchComponent = () => {
			const { fetchLatestPackageConfiguration } = usePluginManagerContext();
			return (
				<button
					onClick={() => fetchLatestPackageConfiguration("https://github.com/arkecosystem/remote-plugin")}
				>
					Fetch
				</button>
			);
		};

		render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [
					`/profiles/${profile.id()}/plugins/details?pluginId=remote-plugin&repositoryURL=https://github.com/arkecosystem/remote-plugin`,
				],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch"));

		await screen.findByText("Remote Plugin");

		userEvent.click(screen.getByTestId("PluginHeader__button--install"));

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.PLUGINS.MODAL_INSTALL_PLUGIN.DESCRIPTION,
		);

		userEvent.click(screen.getByTestId("InstallPlugin__allow-button"));

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenLastCalledWith("plugin:download", {
				name: "remote-plugin",
				url: "https://github.com/arkecosystem/remote-plugin/archive/master.zip",
			}),
		);
	});

	it("should update package", async () => {
		jest.useFakeTimers();
		const ipcRendererSpy = jest.spyOn(ipcRenderer, "invoke").mockRejectedValue("Failed");

		const plugin = new PluginController(
			{
				name: "@dated/delegate-calculator-wallet-plugin",
				version: "0.0.1",
			},
			() => void 0,
		);
		pluginManager.plugins().push(plugin);

		const FetchComponent = () => {
			const { fetchPluginPackages } = usePluginManagerContext();
			return <button onClick={fetchPluginPackages}>Fetch Packages</button>;
		};

		const { container } = render(
			<Route path="/profiles/:profileId/plugins/details">
				<PluginManagerProvider manager={pluginManager} services={[]}>
					<FetchComponent />
					<PluginDetails />
				</PluginManagerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/plugins/details?pluginId=@dated/delegate-calculator-wallet-plugin`],
				withPluginProvider: false,
			},
		);

		userEvent.click(screen.getByText("Fetch Packages"));

		userEvent.click(within(screen.getByTestId("plugin-details__header")).getByTestId("dropdown__toggle"));

		await screen.findByText(translations.COMMON.UPDATE);
		userEvent.click(screen.getByText(translations.COMMON.UPDATE));

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenLastCalledWith("plugin:download", {
				name: "@dated/delegate-calculator-wallet-plugin",
				url:
					"https://registry.npmjs.org/@dated/delegate-calculator-wallet-plugin/-/delegate-calculator-wallet-plugin-1.0.0.tgz",
			}),
		);

		expect(container).toMatchSnapshot();

		jest.useRealTimers();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});
});
