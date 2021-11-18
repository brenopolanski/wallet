import { Contracts } from "@payvo/sdk-profiles";
import { toasts } from "app/services";
import { translations as pluginTranslations } from "domains/plugin/i18n";
import { ipcRenderer } from "electron";
import { PluginManager } from "plugins";
import { PluginManagerProvider } from "plugins/context/PluginManagerProvider";
import React from "react";
import { env, fireEvent, getDefaultProfileId, pluginManager, render, screen, waitFor } from "utils/testing-library";

import { InstallPlugin } from "./InstallPlugin";
import { FirstStep } from "./Step1";
import { SecondStep } from "./Step2";
import { ThirdStep } from "./Step3";

describe("InstallPlugin", () => {
	let profile: Contracts.IProfile;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	it("should not render if not open", () => {
		const { asFragment } = render(
			<PluginManagerProvider manager={new PluginManager()} services={[]}>
				<InstallPlugin profile={profile} isOpen={false} />
			</PluginManagerProvider>,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 1st step", () => {
		const { asFragment } = render(
			<FirstStep plugin={{ permissions: ["PROFILE", "EVENTS", "HTTP", "CUSTOM_PERMISSION"] }} />,
		);

		expect(screen.getByTestId("InstallPlugin__step--first")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 2nd step with partial download progress", () => {
		const { asFragment } = render(
			<SecondStep plugin={{ size: "0 B", title: "My Plugin" }} downloadProgress={{ totalBytes: 100 }} />,
		);

		expect(screen.getByTestId("InstallPlugin__step--second__progress")).toHaveTextContent("0 B / 100 B");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 2nd step with full download progress", () => {
		const { asFragment } = render(
			<SecondStep
				plugin={{ logo: "https://payvo.com/logo.png", size: "100 B", title: "My Plugin" }}
				downloadProgress={{ percent: 0.843_471_432_579, totalBytes: 100, transferredBytes: 84.347_143_257_9 }}
			/>,
		);

		expect(screen.getByTestId("CircularProgressBar__percentage")).toHaveTextContent("84%");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 3rd step", () => {
		const { asFragment } = render(<ThirdStep plugin={{ title: "My Plugin" }} />);

		expect(screen.getByTestId("InstallPlugin__step--third")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 3rd step with plugin logo", () => {
		const { asFragment } = render(
			<ThirdStep plugin={{ logo: "https://payvo.com/logo.png", title: "My Plugin" }} />,
		);

		expect(screen.getByTestId("PluginImage")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should download, install and enable plugin", async () => {
		const toastSpy = jest.spyOn(toasts, "success").mockImplementation();

		const cancelInstall = jest.fn();

		const plugin = {
			id: "remote-plugin",
			permissions: ["PROFILE"],
			title: "Remote Plugin",
		};

		jest.spyOn(ipcRenderer, "on").mockImplementation(((
			channel: string,
			listener: (...arguments_: any[]) => void,
		) => {
			if (channel === "plugin:download-progress") {
				return listener(undefined, { totalBytes: 200 });
			}
		}) as any);

		const invokeSpy = jest.spyOn(ipcRenderer, "invoke").mockImplementation((channel, ...arguments_) => {
			if (channel === "plugin:loader-fs.find") {
				return Promise.resolve({
					config: { keywords: ["@payvo", "wallet-plugin"], name: plugin.id, version: "0.0.1" },
					dir: `/plugins/${plugin.id}`,
					source: "module.exports = () => void 0",
					sourcePath: `/plugins/${plugin.id}/index.js`,
				});
			}

			if (channel === "plugin:install") {
				return Promise.resolve(`/Users/plugins/${plugin.id}`);
			}

			if (channel === "plugin:download") {
				return Promise.resolve(`/Users/plugins/temp/${plugin.id}`);
			}

			if (channel === "plugin:cancel-install") {
				cancelInstall(...arguments_);
			}

			return Promise.resolve();
		});
		const onClose = jest.fn();

		render(
			<PluginManagerProvider manager={pluginManager} services={[]}>
				<InstallPlugin
					profile={profile}
					repositoryURL="https://github.com/author/plugin"
					isOpen={true}
					plugin={plugin}
					onClose={onClose}
				/>
			</PluginManagerProvider>,
		);

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		expect(onClose).toHaveBeenCalledWith();

		const downloadAndInstallPlugin = async () => {
			fireEvent.click(screen.getByTestId("InstallPlugin__allow-button"));

			await screen.findByTestId("InstallPlugin__step--second");

			expect(invokeSpy).toHaveBeenCalledWith("plugin:download", {
				name: plugin.id,
				url: "https://github.com/author/plugin/archive/master.zip",
			});
			expect(invokeSpy).toHaveBeenCalledWith("plugin:install", {
				name: plugin.id,
				profileId: profile.id(),
				savedPath: `/Users/plugins/temp/${plugin.id}`,
			});
			expect(invokeSpy).toHaveBeenLastCalledWith("plugin:loader-fs.find", `/Users/plugins/${plugin.id}`);

			await screen.findByTestId("InstallPlugin__step--third");
		};

		await downloadAndInstallPlugin();

		// Cancel: do not go ahead with enable

		fireEvent.click(screen.getByTestId("InstallPlugin__cancel-button"));

		await waitFor(() =>
			expect(cancelInstall).toHaveBeenCalledWith({
				savedPath: `/Users/plugins/temp/${plugin.id}`,
			}),
		);

		expect(cancelInstall).toHaveBeenCalledTimes(1);

		await downloadAndInstallPlugin();

		// Close: do not go ahead with enable

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		await waitFor(() =>
			expect(cancelInstall).toHaveBeenCalledWith({
				savedPath: `/Users/plugins/temp/${plugin.id}`,
			}),
		);

		expect(cancelInstall).toHaveBeenCalledTimes(2);

		// Happy path: proceed with enable

		await downloadAndInstallPlugin();

		expect(screen.getByText(pluginTranslations.MODAL_ENABLE_PLUGIN.DESCRIPTION)).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("InstallPlugin__enable-button"));

		expect(onClose).toHaveBeenCalledTimes(3);

		expect(pluginManager.plugins().findById(plugin.id)?.isEnabled(profile)).toBeTruthy();

		expect(toastSpy).toHaveBeenCalledWith(pluginTranslations.ENABLE_SUCCESS.replace("{{name}}", plugin.title));

		pluginManager.plugins().removeById(plugin.id, profile);

		toastSpy.mockRestore();
	});

	it("should fail to enable plugin", async () => {
		const toastSpy = jest.spyOn(toasts, "error").mockImplementation();

		const plugin = {
			id: "remote-plugin",
			permissions: ["PROFILE"],
			title: "Remote Plugin",
		};

		jest.spyOn(ipcRenderer, "on").mockImplementation(((
			channel: string,
			listener: (...arguments_: any[]) => void,
		) => {
			if (channel === "plugin:download-progress") {
				return listener(undefined, { totalBytes: 200 });
			}
		}) as any);

		jest.spyOn(ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:loader-fs.find") {
				return Promise.resolve({
					config: { keywords: ["@payvo", "wallet-plugin"], name: plugin.id, version: "0.0.1" },
					dir: `/plugins/${plugin.id}`,
					source: "{ incompatible: true }",
					sourcePath: `/plugins/${plugin.id}/index.js`,
				});
			}

			if (channel === "plugin:install") {
				return Promise.resolve(`/Users/plugins/${plugin.id}`);
			}

			if (channel === "plugin:download") {
				return Promise.resolve(`/Users/plugins/temp/${plugin.id}`);
			}

			return Promise.resolve();
		});

		render(
			<PluginManagerProvider manager={pluginManager} services={[]}>
				<InstallPlugin
					profile={profile}
					repositoryURL="https://github.com/author/plugin"
					isOpen={true}
					plugin={plugin}
				/>
			</PluginManagerProvider>,
		);

		fireEvent.click(screen.getByTestId("InstallPlugin__allow-button"));

		await screen.findByTestId("InstallPlugin__step--second");

		await screen.findByTestId("InstallPlugin__step--third");

		fireEvent.click(screen.getByTestId("InstallPlugin__enable-button"));

		expect(pluginManager.plugins().findById(plugin.id)?.isEnabled(profile)).toBeFalsy();

		expect(toastSpy).toHaveBeenCalledWith(expect.stringMatching(/Failed to enable plugin/));

		pluginManager.plugins().removeById(plugin.id, profile);

		toastSpy.mockRestore();
	});
});
