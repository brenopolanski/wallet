/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { toasts } from "app/services";
import { ipcRenderer } from "electron";
import { createMemoryHistory } from "history";
import nock from "nock";
import { LaunchPluginService, PluginController } from "plugins";
import { usePluginManagerContext } from "plugins/context/PluginManagerProvider";
import React, { useEffect } from "react";
import { Route } from "react-router-dom";
import {
	act,
	env,
	fireEvent,
	getDefaultProfileId,
	pluginManager,
	renderWithRouter,
	screen,
	waitFor,
	within,
} from "utils/testing-library";

import { translations } from "../../i18n";
import { PluginManager } from "./PluginManager";

let profile: Contracts.IProfile;
const history = createMemoryHistory();

const fixtureProfileId = getDefaultProfileId();
const pluginsURL = `/profiles/${fixtureProfileId}/plugins`;

const Component = () => {
	const { fetchPluginPackages } = usePluginManagerContext();

	useEffect(() => {
		fetchPluginPackages();
	}, []);

	return <PluginManager />;
};

describe("PluginManager", () => {
	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		history.push(pluginsURL);
	});

	it.each([true, false])("should render when useExpandedTables = %s", async (isExpandedTables: boolean) => {
		const profileAppearanceMock = jest.spyOn(profile.appearance(), "get").mockReturnValue(isExpandedTables);

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		expect(screen.getByTestId("header__title")).toHaveTextContent(translations.PAGE_PLUGIN_MANAGER.TITLE);
		expect(screen.getByTestId("header__subtitle")).toHaveTextContent(translations.PAGE_PLUGIN_MANAGER.DESCRIPTION);

		await waitFor(() =>
			expect(
				within(screen.getByTestId("PluginManager__latest__utility")).getAllByText("ARK Delegate Calculator"),
			).toHaveLength(1),
		);

		await waitFor(() => expect(screen.getAllByTestId("Card")).toHaveLength(9));

		expect(asFragment()).toMatchSnapshot();

		profileAppearanceMock.mockRestore();
	});

	it("should toggle between list and grid on latest", async () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() =>
			expect(
				within(screen.getByTestId("PluginManager__latest__utility")).getAllByText("ARK Delegate Calculator"),
			).toHaveLength(1),
		);

		await waitFor(() => expect(screen.getAllByTestId("Card")).toHaveLength(9));

		expect(
			within(screen.getByTestId("PluginManager__latest__utility")).getByTestId("PluginGrid"),
		).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		expect(
			within(screen.getByTestId("PluginManager__latest__utility")).getByTestId("PluginList"),
		).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("LayoutControls__grid--icon"));

		expect(
			within(screen.getByTestId("PluginManager__latest__utility")).getByTestId("PluginGrid"),
		).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle between list and grid on all", async () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-all"));

		await waitFor(() =>
			expect(
				within(screen.getByTestId("PluginManager__container--all")).getAllByText("ARK Delegate Calculator"),
			).toHaveLength(1),
		);

		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		expect(
			within(screen.getByTestId("PluginManager__container--all")).getByTestId("PluginList"),
		).toBeInTheDocument();

		act(() => {
			fireEvent.click(screen.getByTestId("LayoutControls__grid--icon"));
		});

		expect(
			within(screen.getByTestId("PluginManager__container--all")).getByTestId("PluginGrid"),
		).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle between list and grid on a category tab", async () => {
		const category = "utility";

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() =>
			expect(
				within(screen.getByTestId(`PluginManager__latest__${category}`)).getByTestId("PluginGrid"),
			).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByTestId(`tabs__tab-button-${category}`));

		expect(
			within(screen.getByTestId(`PluginManager__container--${category}`)).getByTestId("PluginGrid"),
		).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		expect(
			within(screen.getByTestId(`PluginManager__container--${category}`)).getByTestId("PluginList"),
		).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("LayoutControls__grid--icon"));

		expect(
			within(screen.getByTestId(`PluginManager__container--${category}`)).getByTestId("PluginGrid"),
		).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should switch to category by clicking on view all link", async () => {
		// add plugins to fill category
		const plugins = Array.from({ length: 5 }).map((_, index) => {
			const plugin = new PluginController(
				{ "desktop-wallet": { categories: ["other"] }, name: `test-plugin-${index}` },
				() => void 0,
			);

			pluginManager.plugins().push(plugin);

			return plugin;
		});

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() => {
			for (const plugin of plugins.slice(0, 3)) {
				expect(
					within(screen.getByTestId("PluginManager__latest__other")).getAllByText(plugin.config().title()),
				).toHaveLength(1);
			}
		});

		fireEvent.click(screen.getByTestId("PluginManager__latest__other__view-all"));

		expect(screen.getByTestId("PluginManager__container--other")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();

		// remove plugins
		for (const plugin of plugins) {
			pluginManager.plugins().removeById(plugin.config().id(), profile);
		}
	});

	it.skip("should download & install plugin on latest", async () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() =>
			expect(
				within(screen.getByTestId("PluginManager__latest__gaming")).getByTestId("PluginGrid"),
			).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		fireEvent.click(screen.getAllByTestId("PluginListItem__install")[0]);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_INSTALL_PLUGIN.DESCRIPTION);

		fireEvent.click(screen.getByTestId("InstallPlugin__download-button"));

		await waitFor(() => expect(screen.getByTestId("InstallPlugin__continue-button")).toBeInTheDocument());

		fireEvent.click(screen.getByTestId("InstallPlugin__continue-button"));

		await waitFor(() => expect(screen.getByTestId("InstallPlugin__enable-button")).toBeInTheDocument());

		fireEvent.click(screen.getByTestId("InstallPlugin__enable-button"));

		await waitFor(() => expect(screen.getByTestId("InstallPlugin__step--third")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should open and accept disclaimer", async () => {
		const mockAcceptedManualInstallation = jest
			.spyOn(profile, "hasAcceptedManualInstallationDisclaimer")
			.mockReturnValue(false);

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("PluginManager_header--install"));

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MANUAL_INSTALLATION_DISCLAIMER.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.MANUAL_INSTALLATION_DISCLAIMER.DISCLAIMER.replace(/\n\n/g, " "),
		);

		fireEvent.click(screen.getByTestId("ManualInstallationDisclaimer__accept-button"));
		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(
				translations.MODAL_MANUAL_INSTALL_PLUGIN.TITLE,
			),
		);

		mockAcceptedManualInstallation.mockRestore();
	});

	it("should open, accept disclaimer and remember choice", async () => {
		const mockAcceptedManualInstallation = jest
			.spyOn(profile, "hasAcceptedManualInstallationDisclaimer")
			.mockReturnValue(false);

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("PluginManager_header--install"));

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MANUAL_INSTALLATION_DISCLAIMER.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.MANUAL_INSTALLATION_DISCLAIMER.DISCLAIMER.replace(/\n\n/g, " "),
		);

		fireEvent.click(screen.getByTestId("ManualInstallationDisclaimer__rememberChoice-toggle"));

		fireEvent.click(screen.getByTestId("ManualInstallationDisclaimer__accept-button"));
		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(
				translations.MODAL_MANUAL_INSTALL_PLUGIN.TITLE,
			),
		);

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		mockAcceptedManualInstallation.mockRestore();

		fireEvent.click(screen.getByTestId("PluginManager_header--install"));

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_MANUAL_INSTALL_PLUGIN.TITLE);
	});

	it.each([
		["close", "modal__close-btn"],
		["decline", "ManualInstallationDisclaimer__decline-button"],
	])("should open and %s disclaimer", async (_, buttonId) => {
		const mockAcceptedManualInstallation = jest
			.spyOn(profile, "hasAcceptedManualInstallationDisclaimer")
			.mockReturnValue(false);

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("PluginManager_header--install"));

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MANUAL_INSTALLATION_DISCLAIMER.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.MANUAL_INSTALLATION_DISCLAIMER.DISCLAIMER.replace(/\n\n/g, " "),
		);

		fireEvent.click(screen.getByTestId(buttonId));

		await waitFor(() => expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/));

		mockAcceptedManualInstallation.mockRestore();
	});

	it("should install plugin from header install button", async () => {
		const mockAcceptedManualInstallation = jest
			.spyOn(profile, "hasAcceptedManualInstallationDisclaimer")
			.mockReturnValue(true);

		nock("https://github.com/")
			.get("/arkecosystem/test-plugin/raw/master/package.json")
			.reply(200, { keywords: ["@payvo", "wallet-plugin"], name: "test-plugin" });

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<PluginManager />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		// Open and close
		fireEvent.click(screen.getByTestId("PluginManager_header--install"));
		await waitFor(() => expect(screen.getByTestId("PluginManualInstallModal")).toBeInTheDocument());
		fireEvent.click(screen.getByTestId("modal__close-btn"));

		// Open and type
		fireEvent.click(screen.getByTestId("PluginManager_header--install"));
		await waitFor(() => expect(screen.getByTestId("PluginManualInstallModal")).toBeInTheDocument());

		fireEvent.input(screen.getByTestId("PluginManualInstallModal__input"), {
			target: { value: "https://github.com/arkecosystem/test-plugin" },
		});

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		await waitFor(async () => {
			expect(screen.getByTestId("PluginManualInstallModal__submit-button")).not.toBeDisabled();
		});

		fireEvent.click(screen.getByTestId("PluginManualInstallModal__submit-button"));

		const redirectUrl = `/profiles/${fixtureProfileId}/plugins/details?pluginId=test-plugin&repositoryURL=https://github.com/arkecosystem/test-plugin`;
		await waitFor(() => expect(historySpy).toHaveBeenCalledWith(redirectUrl));

		historySpy.mockRestore();

		mockAcceptedManualInstallation.mockRestore();
	});

	it("should cancel install plugin", async () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() =>
			expect(
				within(screen.getByTestId("PluginManager__latest__gaming")).getByTestId("PluginGrid"),
			).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));
		await waitFor(() => expect(screen.getAllByTestId("PluginListItem__install")[0]).toBeInTheDocument());

		fireEvent.click(screen.getAllByTestId("PluginListItem__install")[0]);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_INSTALL_PLUGIN.DESCRIPTION);

		fireEvent.click(screen.getByTestId("InstallPlugin__cancel-button"));

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should search for plugin", async () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() =>
			expect(
				within(screen.getByTestId("PluginManager__latest__gaming")).getByTestId("PluginGrid"),
			).toBeInTheDocument(),
		);

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		expect(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input")).toBeInTheDocument();

		fireEvent.input(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input"), {
			target: { value: "ARK Delegate Calculator" },
		});

		await waitFor(() => expect(screen.getByText(translations.PAGE_PLUGIN_MANAGER.VIEW.SEARCH)).toBeInTheDocument());
		await waitFor(() => expect(screen.getAllByTestId("PluginImage")).toHaveLength(1));

		fireEvent.input(within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input"), {
			target: { value: "unknown search query" },
		});

		await waitFor(() => expect(screen.getByTestId("PluginGrid__empty-message")).toBeInTheDocument());

		// Switch to list view
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		await waitFor(() => expect(screen.getByTestId("PluginList__empty-message")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should download plugin", async () => {
		const ipcRendererSpy = jest.spyOn(ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:download") {
				return "/plugins/new-plugin";
			}
		});

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() =>
			expect(
				within(screen.getByTestId("PluginManager__latest__gaming")).getByTestId("PluginGrid"),
			).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));
		fireEvent.click(screen.getAllByTestId("PluginListItem__install")[0]);

		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_INSTALL_PLUGIN.DESCRIPTION),
		);

		fireEvent.click(screen.getByTestId("InstallPlugin__allow-button"));

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenLastCalledWith("plugin:download", {
				name: "@dated/delegate-calculator-wallet-plugin",
				url:
					"https://registry.npmjs.org/@dated/delegate-calculator-wallet-plugin/-/delegate-calculator-wallet-plugin-1.0.0.tgz",
			}),
		);

		ipcRendererSpy.mockRestore();
	});

	it("should fail to download plugin", async () => {
		const ipcRendererSpy = jest.spyOn(ipcRenderer, "invoke").mockRejectedValue("Failed");
		const toastSpy = jest.spyOn(toasts, "error");

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() =>
			expect(
				within(screen.getByTestId("PluginManager__latest__gaming")).getByTestId("PluginGrid"),
			).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));
		fireEvent.click(screen.getAllByTestId("PluginListItem__install")[0]);

		await waitFor(() =>
			expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_INSTALL_PLUGIN.DESCRIPTION),
		);

		fireEvent.click(screen.getByTestId("InstallPlugin__allow-button"));

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenLastCalledWith("plugin:download", {
				name: "@dated/delegate-calculator-wallet-plugin",
				url:
					"https://registry.npmjs.org/@dated/delegate-calculator-wallet-plugin/-/delegate-calculator-wallet-plugin-1.0.0.tgz",
			}),
		);

		await waitFor(() => expect(toastSpy).toHaveBeenCalled());

		ipcRendererSpy.mockRestore();
		toastSpy.mockRestore();
	});

	it("should select plugin on latest grids", async () => {
		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() => expect(screen.getAllByText("ARK Delegate Calculator").length).toBeGreaterThan(0));
		await waitFor(() => expect(screen.getAllByTestId("Card")).toHaveLength(9));

		fireEvent.click(
			within(screen.getByTestId("PluginManager__latest__utility")).getAllByText("ARK Delegate Calculator")[0],
		);

		expect(history.location.pathname).toEqual(`/profiles/${fixtureProfileId}/plugins/details`);
		expect(history.location.search).toEqual("?pluginId=@dated/delegate-calculator-wallet-plugin");
	});

	it("should open the plugin view page", async () => {
		const plugin = new PluginController(
			{ "desktop-wallet": { permissions: ["LAUNCH"] }, name: "test-plugin" },
			(api) => api.launch().render(<h1>My Plugin View</h1>),
		);

		pluginManager.services().register([new LaunchPluginService()]);
		pluginManager.plugins().push(plugin);

		plugin.enable(profile, { autoRun: true });

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		fireEvent.click(screen.getByTestId("PluginListItem__launch"));

		const redirectUrl = `/profiles/${profile.id()}/plugins/view?pluginId=test-plugin`;
		await waitFor(() => expect(historySpy).toHaveBeenCalledWith(redirectUrl));

		plugin.disable(profile);

		pluginManager.plugins().removeById(plugin.config().id(), profile);

		historySpy.mockRestore();
	});

	it("should enable plugin on my-plugins", async () => {
		const onEnabled = jest.fn();
		const plugin = new PluginController({ name: "test-plugin" }, onEnabled);
		pluginManager.plugins().push(plugin);

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() => expect(screen.getAllByText("ARK Delegate Calculator").length).toBeGreaterThan(0));
		await waitFor(() => expect(screen.getAllByTestId("Card")).toHaveLength(9));

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		expect(screen.getByTestId("PluginListItem__disabled")).toBeInTheDocument();

		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getAllByTestId("dropdown__toggle")[0],
		);
		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getByText(commonTranslations.ENABLE),
		);

		await waitFor(() => expect(screen.getByTestId("PluginListItem__enabled")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
		expect(onEnabled).toHaveBeenCalled();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should fail to enable", async () => {
		const toastSpy = jest.spyOn(toasts, "error").mockImplementation();
		const plugin = new PluginController({ name: "test-plugin" }, { incompatible: true });
		pluginManager.plugins().push(plugin);

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		await waitFor(() => expect(screen.getAllByText("ARK Delegate Calculator").length).toBeGreaterThan(0));
		await waitFor(() => expect(screen.getAllByTestId("Card")).toHaveLength(9));

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		expect(screen.getByTestId("PluginListItem__disabled")).toBeInTheDocument();

		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getAllByTestId("dropdown__toggle")[0],
		);
		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getByText(commonTranslations.ENABLE),
		);

		expect(toastSpy).toHaveBeenCalled();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should disable plugin on my-plugins", async () => {
		const onEnabled = jest.fn();
		const plugin = new PluginController({ name: "test-plugin" }, onEnabled);
		pluginManager.plugins().push(plugin);
		plugin.enable(profile);

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		expect(screen.getByTestId("PluginListItem__enabled")).toBeInTheDocument();

		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getAllByTestId("dropdown__toggle")[0],
		);
		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getByText(commonTranslations.DISABLE),
		);

		await waitFor(() => expect(screen.getByTestId("PluginListItem__disabled")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should update plugin on my-plugins", async () => {
		const ipcRendererSpy = jest.spyOn(ipcRenderer, "invoke").mockRejectedValue("Failed");

		const plugin = new PluginController(
			{ name: "@dated/delegate-calculator-wallet-plugin", version: "0.0.1" },
			() => void 0,
		);
		pluginManager.plugins().push(plugin);

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		await waitFor(() => expect(screen.getByTestId("PluginDropdown__update-badge")).toBeInTheDocument());

		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getAllByTestId("dropdown__toggle")[0],
		);
		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getByText(commonTranslations.UPDATE),
		);

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenCalledWith("plugin:download", {
				name: "@dated/delegate-calculator-wallet-plugin",
				url: "https://github.com/dated/delegate-calculator-wallet-plugin/archive/master.zip",
			}),
		);

		expect(asFragment()).toMatchSnapshot();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should close confirmation window", async () => {
		const onEnabled = jest.fn();
		const plugin = new PluginController({ name: "test-plugin" }, onEnabled);
		pluginManager.plugins().push(plugin);

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getAllByTestId("dropdown__toggle")[0],
		);
		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getByText(commonTranslations.DELETE),
		);

		await waitFor(() => expect(screen.getByTestId("PluginUninstallConfirmation")).toBeInTheDocument());

		const invokeMock = jest.spyOn(ipcRenderer, "invoke").mockResolvedValue([]);
		fireEvent.click(screen.getByTestId("PluginUninstall__cancel-button"));

		expect(() => screen.getByTestId("PluginUninstallConfirmation")).toThrow(/Unable to find an element by/);

		pluginManager.plugins().removeById(plugin.config().id(), profile);

		invokeMock.mockRestore();
	});

	it("should delete plugin on my-plugins", async () => {
		const onEnabled = jest.fn();

		const plugin = new PluginController({ name: "test-plugin" }, onEnabled);
		pluginManager.plugins().push(plugin);

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getAllByTestId("dropdown__toggle")[0],
		);
		fireEvent.click(
			within(screen.getByTestId("PluginManager__container--my-plugins")).getByText(commonTranslations.DELETE),
		);

		await waitFor(() => expect(screen.getByTestId("PluginUninstallConfirmation")).toBeInTheDocument());

		const invokeMock = jest.spyOn(ipcRenderer, "invoke").mockResolvedValue([]);
		fireEvent.click(screen.getByTestId("PluginUninstall__submit-button"));

		await waitFor(() => expect(pluginManager.plugins().findById(plugin.config().id())).toBeUndefined());

		expect(() => screen.getByTestId("PluginUninstallConfirmation")).toThrow(/Unable to find an element by/);

		invokeMock.mockRestore();
	});

	it("should show update all banner", async () => {
		const plugin = new PluginController(
			{ name: "@dated/delegate-calculator-wallet-plugin", version: "0.0.1" },
			() => void 0,
		);
		pluginManager.plugins().push(plugin);

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		await waitFor(() => expect(screen.getByTestId("PluginManager__update-all")).toBeInTheDocument());

		expect(screen.getByTestId("PluginManager__update-all")).not.toBeDisabled();

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should show and close the update confirmation modal", async () => {
		const plugin = new PluginController(
			{ name: "@dated/delegate-calculator-wallet-plugin", version: "0.0.1" },
			() => void 0,
		);
		pluginManager.plugins().push(plugin);

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		await waitFor(() => expect(screen.getByTestId("PluginManager__update-all")).toBeInTheDocument());

		expect(screen.getByTestId("PluginManager__update-all")).not.toBeDisabled();

		fireEvent.click(screen.getByTestId("PluginManager__update-all"));

		await waitFor(() => expect(screen.getByTestId("PluginUpdatesConfirmation")).toBeInTheDocument());

		expect(screen.getByText("1.0.0")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("PluginUpdates__cancel-button"));

		expect(() => screen.getByTestId("PluginUpdatesConfirmation")).toThrow(/Unable to find an element by/);

		pluginManager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should show and continue the update confirmation modal", async () => {
		let downloadsCount = 0;
		let installCount = 0;

		jest.spyOn(ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:download") {
				downloadsCount++;
				return "/plugins/new-plugin";
			}

			if (channel === "plugin:install") {
				installCount++;
				return "/plugins/test-plugin";
			}
		});

		pluginManager
			.plugins()
			.push(
				new PluginController(
					{ name: "@dated/delegate-calculator-wallet-plugin", version: "0.0.1" },
					() => void 0,
				),
			);

		pluginManager
			.plugins()
			.push(new PluginController({ name: "@payvo/ark-explorer-wallet-plugin", version: "0.0.1" }, () => void 0));

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		await waitFor(() => expect(screen.getByTestId("PluginManager__update-all")).toBeInTheDocument());

		fireEvent.click(screen.getByTestId("PluginManager__update-all"));

		await waitFor(() => expect(screen.getByTestId("PluginUpdatesConfirmation")).toBeInTheDocument());

		expect(screen.getAllByText("1.0.0").length).toBeGreaterThan(0);

		fireEvent.click(screen.getByTestId("PluginUpdates__continue-button"));

		await waitFor(() => expect(downloadsCount).toBe(2));
		await waitFor(() => expect(installCount).toBe(2));
	});

	it("should show disabled update all banner if all updates are incompatible", async () => {
		process.env.REACT_APP_PLUGIN_MINIMUM_VERSION = "100.0.0";

		const plugin = new PluginController(
			{ name: "@dated/delegate-calculator-wallet-plugin", version: "0.0.1" },
			() => void 0,
		);
		pluginManager.plugins().push(plugin);

		renderWithRouter(
			<Route path="/profiles/:profileId/plugins">
				<Component />
			</Route>,
			{
				history,
				routes: [pluginsURL],
			},
		);

		fireEvent.click(screen.getByTestId("tabs__tab-button-my-plugins"));
		fireEvent.click(screen.getByTestId("LayoutControls__list--icon"));

		await waitFor(() => expect(screen.getByTestId("PluginManager__update-all")).toBeInTheDocument());

		expect(screen.getByTestId("PluginManager__update-all")).toBeDisabled();

		pluginManager.plugins().removeById(plugin.config().id(), profile);

		process.env.REACT_APP_PLUGIN_MINIMUM_VERSION = undefined;
	});
});
