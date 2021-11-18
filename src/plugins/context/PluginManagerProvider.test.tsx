import { Contracts, Profile } from "@payvo/sdk-profiles";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnvironmentProvider } from "app/contexts";
import electron from "electron";
import nock from "nock";
import { PluginController, PluginManager } from "plugins/core";
import { PluginConfigurationData } from "plugins/core/configuration";
import React, { useState } from "react";
import { env, getDefaultProfileId } from "utils/testing-library";

import { PluginManagerProvider, usePluginManagerContext } from "./PluginManagerProvider";

describe("PluginManagerProvider", () => {
	let manager: PluginManager;
	let profile: Contracts.IProfile;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		manager = new PluginManager();
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it("should load plugins", async () => {
		const invokeMock = jest.spyOn(electron.ipcRenderer, "invoke").mockResolvedValue([]);

		const Component = () => {
			const { loadPlugins } = usePluginManagerContext();
			const onClick = async () => await loadPlugins(profile);
			return <button onClick={onClick}>Click</button>;
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByRole("button"));

		await waitFor(() => expect(invokeMock).toHaveBeenCalledWith("plugin:loader-fs.search", profile.id()));
	});

	it("should report plugin", () => {
		const ipcRendererMock = jest.spyOn(electron.ipcRenderer, "send").mockImplementation();

		const plugin = new PluginController({ name: "test-plugin" }, () => void 0);

		const Component = () => {
			const { reportPlugin } = usePluginManagerContext();
			const onClick = () => reportPlugin(plugin.config());
			return <button onClick={onClick}>Click</button>;
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByRole("button"));

		expect(ipcRendererMock).toHaveBeenCalledWith(
			"open-external",
			"https://payvo.com/contact?subject=desktop_wallet_plugin_report&plugin_id=test-plugin&plugin_version=0.0.0",
		);

		ipcRendererMock.mockRestore();
	});

	it("should restore all enabled plugins", async () => {
		const restoreSpy = jest.spyOn(manager.plugins(), "runAllEnabled").mockImplementation();

		const Component = () => {
			const { restoreEnabledPlugins } = usePluginManagerContext();
			const onClick = async () => await restoreEnabledPlugins(profile);
			return <button onClick={onClick}>Click</button>;
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByRole("button"));

		await waitFor(() => expect(restoreSpy).toHaveBeenCalledWith(expect.any(Profile)));

		restoreSpy.mockRestore();
	});

	it("should reset plugins", () => {
		const disposeSpy = jest.spyOn(manager.plugins(), "dispose").mockImplementation();

		const Component = () => {
			const { resetPlugins } = usePluginManagerContext();
			const onClick = () => resetPlugins();
			return <button onClick={onClick}>Click</button>;
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByRole("button"));

		expect(disposeSpy).toHaveBeenCalledWith();

		disposeSpy.mockRestore();
	});

	it("should delete plugin", async () => {
		const invokeMock = jest.spyOn(electron.ipcRenderer, "invoke").mockResolvedValue([]);

		const plugin = new PluginController({ name: "test-plugin" }, () => void 0, "/plugins/example");

		const Component = () => {
			const { deletePlugin } = usePluginManagerContext();
			const onClick = () => deletePlugin(plugin, profile);
			return <button onClick={onClick}>Click</button>;
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByRole("button"));

		expect(invokeMock).toHaveBeenLastCalledWith("plugin:loader-fs.remove", "/plugins/example");

		await screen.findByRole("button");
	});

	it("should fetch packages", async () => {
		const plugin = new PluginController({ name: "test-plugin" }, () => void 0);
		manager.plugins().push(plugin);

		plugin.enable(profile);

		const Component = () => {
			const { fetchPluginPackages, allPlugins } = usePluginManagerContext();
			const onClick = () => fetchPluginPackages();
			return (
				<div>
					<button onClick={onClick}>Click</button>
					<ul>
						{allPlugins.map((package_) => (
							<li key={package_.name()}>{package_.name()}</li>
						))}
					</ul>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByRole("button"));

		await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3));

		manager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should install plugin from provider", async () => {
		const ipcRendererSpy = jest.spyOn(electron.ipcRenderer, "invoke").mockImplementation((channel: string) => {
			if (channel === "plugin:install") {
				return Promise.resolve("/plugins/test-plugin");
			}

			if (channel === "plugin:loader-fs.find") {
				return Promise.resolve({
					config: { keywords: ["@payvo", "wallet-plugin"], name: "test-plugin", version: "0.0.1" },
					dir: "/plugins/test-plugin",
					source: () => void 0,
					sourcePath: "/plugins/test-plugin/index.js",
				});
			}

			return Promise.resolve();
		});

		const Component = () => {
			const { fetchPluginPackages, allPlugins, installPlugin } = usePluginManagerContext();
			const onClick = () => fetchPluginPackages();

			return (
				<div>
					<button onClick={onClick}>Fetch</button>
					<ul>
						{allPlugins.map((package_) => (
							<li key={package_.name()}>
								<span>{package_.name()}</span>
								<button
									onClick={() =>
										installPlugin("/plugins/temp/test-plugin", package_.name(), profile.id())
									}
								>
									Install
								</button>
							</li>
						))}
					</ul>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Fetch"));

		await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2));

		userEvent.click(screen.getAllByText("Install")[0]);

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenLastCalledWith("plugin:install", {
				name: "@dated/delegate-calculator-wallet-plugin",
				profileId: profile.id(),
				savedPath: "/plugins/temp/test-plugin",
			}),
		);

		expect(manager.plugins().findById("test-plugin")).toBeDefined();

		ipcRendererSpy.mockRestore();
	});

	it("should download plugin from archive url", async () => {
		const ipcRendererSpy = jest.spyOn(electron.ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:download") {
				return "/plugins/test-plugin";
			}
		});

		const Component = () => {
			const { downloadPlugin } = usePluginManagerContext();
			return (
				<div>
					<button
						onClick={() =>
							downloadPlugin({
								archiveUrl:
									"https://registry.npmjs.org/arkecosystem/test-plugin/-/test-plugin-1.0.0.tgz",
								id: "test-plugin",
							} as any)
						}
					>
						Fetch
					</button>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Fetch"));

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenLastCalledWith("plugin:download", {
				name: "test-plugin",
				url: "https://registry.npmjs.org/arkecosystem/test-plugin/-/test-plugin-1.0.0.tgz",
			}),
		);

		ipcRendererSpy.mockRestore();
	});

	it("should download plugin from custom url", async () => {
		const ipcRendererSpy = jest.spyOn(electron.ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:loader-fs.find") {
				return {
					config: { keywords: ["@payvo", "wallet-plugin"], name: "test-plugin", version: "0.0.1" },
					dir: "/plugins/test-plugin",
					source: () => void 0,
					sourcePath: "/plugins/test-plugin/index.js",
				};
			}

			if (channel === "plugin:download") {
				return "/plugins/test-plugin";
			}
		});

		const Component = () => {
			const { downloadPlugin } = usePluginManagerContext();
			return (
				<div>
					<button
						onClick={() =>
							downloadPlugin({ id: "test-plugin" } as any, "https://github.com/arkecosystem/test-plugin")
						}
					>
						Fetch
					</button>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Fetch"));

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenLastCalledWith("plugin:download", {
				name: "test-plugin",
				url: "https://github.com/arkecosystem/test-plugin/archive/master.zip",
			}),
		);

		ipcRendererSpy.mockRestore();
	});

	it("should download plugin from custom url in subdirectory", async () => {
		const ipcRendererSpy = jest.spyOn(electron.ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:loader-fs.find") {
				return {
					config: { keywords: ["@payvo", "wallet-plugin"], name: "test-plugin", version: "0.0.1" },
					dir: "/plugins/test-plugin",
					source: () => void 0,
					sourcePath: "/plugins/test-plugin/index.js",
				};
			}

			if (channel === "plugin:download") {
				return "/plugins/test-plugin";
			}
		});

		const Component = () => {
			const { downloadPlugin } = usePluginManagerContext();
			return (
				<div>
					<button
						onClick={() =>
							downloadPlugin(
								{ id: "test-plugin" } as any,
								"https://github.com/arkecosystem/repository/tree/master/subdirectory/test-plugin",
							)
						}
					>
						Fetch
					</button>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Fetch"));

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenLastCalledWith("plugin:download", {
				name: "test-plugin",
				url: "https://github.com/arkecosystem/repository/archive/master.zip",
			}),
		);

		ipcRendererSpy.mockRestore();
	});

	it("should render properly for remote package", async () => {
		nock("https://github.com/")
			.get("/arkecosystem/remote-plugin/raw/master/package.json")
			.reply(200, { keywords: ["@payvo", "wallet-plugin"], name: "remote-plugin" });

		const Component = () => {
			const { fetchLatestPackageConfiguration, pluginConfigurations } = usePluginManagerContext();
			return (
				<>
					<button
						onClick={() => fetchLatestPackageConfiguration("https://github.com/arkecosystem/remote-plugin")}
					>
						Fetch Package
					</button>
					<ul>
						{pluginConfigurations.map((item) => (
							<li key={item.id()}>{item.name()}</li>
						))}
					</ul>
				</>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Fetch Package"));

		await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
	});

	it("should render properly for remote package in subdirectory", async () => {
		nock("https://github.com/")
			.get("/arkecosystem/repository/raw/master/subdirectory/remote-plugin/package.json")
			.reply(200, { keywords: ["@payvo", "wallet-plugin"], name: "remote-plugin" });

		const Component = () => {
			const { fetchLatestPackageConfiguration, pluginConfigurations } = usePluginManagerContext();
			return (
				<>
					<button
						onClick={() =>
							fetchLatestPackageConfiguration(
								"https://github.com/arkecosystem/repository/tree/master/subdirectory/remote-plugin",
							)
						}
					>
						Fetch Package
					</button>
					<ul>
						{pluginConfigurations.map((item) => (
							<li key={item.id()}>{item.name()}</li>
						))}
					</ul>
				</>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Fetch Package"));

		await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));
	});

	it("should map config to plugin data", () => {
		const config = PluginConfigurationData.make({ name: "my-plugin" });

		const Component = () => {
			const { mapConfigToPluginData } = usePluginManagerContext();
			const pluginData = mapConfigToPluginData(profile, config);

			return <span>{pluginData.name}</span>;
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		expect(screen.getByText("my-plugin")).toBeInTheDocument();
	});

	it("should check if plugin update is available", async () => {
		const plugin = new PluginController(
			{
				"desktop-wallet": { minimumVersion: "4.0.0" },
				name: "@dated/delegate-calculator-wallet-plugin",
				version: "0.0.1",
			},
			() => void 0,
		);
		manager.plugins().push(plugin);

		const Component = () => {
			const { fetchPluginPackages, allPlugins, mapConfigToPluginData } = usePluginManagerContext();
			const onClick = () => fetchPluginPackages();
			const pluginDatas = allPlugins.map(mapConfigToPluginData.bind(null, profile));

			return (
				<div>
					<button onClick={onClick}>Click</button>
					<ul>
						{pluginDatas.map((package_) => (
							<li key={package_.id}>{package_.updateStatus.isAvailable ? "Update Available" : "No"}</li>
						))}
					</ul>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Click"));

		await screen.findByText("Update Available");
	});

	it("should check if plugin update is available for plugin without minimum version", async () => {
		const plugin = new PluginController(
			{
				"desktop-wallet": { minimumVersion: "0.0.0" },
				name: "@payvo/ark-explorer-wallet-plugin",
				version: "0.0.1",
			},
			() => void 0,
		);
		manager.plugins().push(plugin);

		const Component = () => {
			const { fetchPluginPackages, allPlugins, mapConfigToPluginData } = usePluginManagerContext();
			const onClick = () => fetchPluginPackages();
			const pluginDatas = allPlugins.map(mapConfigToPluginData.bind(null, profile));

			return (
				<div>
					<button onClick={onClick}>Click</button>
					<ul>
						{pluginDatas.map((package_) => (
							<li key={package_.id}>{package_.updateStatus.isAvailable ? "Update Available" : "No"}</li>
						))}
					</ul>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Click"));

		await screen.findByText("Update Available");
	});

	it("should update plugin", async () => {
		const plugin = new PluginController(
			{
				archiveUrl:
					"https://registry.npmjs.org/@payvo/ark-explorer-wallet-plugin/-/ark-explorer-wallet-plugin-1.0.0.tgz",
				"desktop-wallet": { minimumVersion: "0.0.0" },
				name: "@payvo/ark-explorer-wallet-plugin",
				version: "0.0.1",
			},
			() => void 0,
		);

		manager.plugins().push(plugin);

		const onSpy = jest.spyOn(electron.ipcRenderer, "on").mockImplementation((channel, listener) => {
			if (channel === "plugin:download-progress") {
				listener(undefined, {
					name: plugin.config().name(),
					percent: 1,
					totalBytes: 200,
					transferredBytes: 200,
				});

				listener(undefined, {
					name: "other download in progress",
					percent: 0.5,
					totalBytes: 200,
					transferredBytes: 100,
				});
			}
		});

		const ipcRendererSpy = jest.spyOn(electron.ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:install") {
				return Promise.resolve("/plugins/test-plugin");
			}

			if (channel === "plugin:loader-fs.find") {
				return Promise.resolve({
					config: {
						keywords: ["@payvo", "wallet-plugin"],
						name: plugin.config().name(),
						version: "1.0.0",
					},
					dir: "/plugins/test-plugin",
					source: () => void 0,
					sourcePath: "/plugins/test-plugin/index.js",
				});
			}

			if (channel === "plugin:download") {
				return Promise.resolve("/plugins/temp/test-plugin");
			}

			return Promise.resolve();
		});

		const Component = () => {
			const {
				fetchPluginPackages,
				allPlugins,
				mapConfigToPluginData,
				updatePlugin,
				updatingStats,
			} = usePluginManagerContext();
			const pluginItems = allPlugins.map(mapConfigToPluginData.bind(null, profile));

			return (
				<div>
					<button onClick={() => fetchPluginPackages()}>Fetch</button>
					<ul>
						{pluginItems.map((pluginItem) => (
							<li key={pluginItem.id}>
								{pluginItem.updateStatus.isAvailable ? (
									<button onClick={() => updatePlugin(pluginItem, profile.id())}>
										Status: update available. Click to update
									</button>
								) : (
									<span>Status: no update available</span>
								)}

								{updatingStats[pluginItem.id]?.completed && <span>Status: update completed</span>}
							</li>
						))}
					</ul>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Fetch"));

		await screen.findByText("Status: update available. Click to update");

		userEvent.click(screen.getByText("Status: update available. Click to update"));

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenCalledWith("plugin:download", {
				name: plugin.config().name(),
				url: plugin.config().archiveUrl(),
			}),
		);

		await waitFor(() =>
			expect(ipcRendererSpy).toHaveBeenCalledWith("plugin:install", {
				name: plugin.config().name(),
				profileId: profile.id(),
				savedPath: "/plugins/temp/test-plugin",
			}),
		);

		await waitFor(() =>
			expect(manager.plugins().findById(plugin.config().name())?.config().version()).toBe("1.0.0"),
		);

		await waitFor(
			() => {
				expect(screen.getByText("Status: update completed")).toBeInTheDocument();
			},
			{ timeout: 2000 },
		);

		ipcRendererSpy.mockRestore();
		onSpy.mockRestore();
		jest.useRealTimers();
	});

	it("should handle and exception while updating a plugin", async () => {
		jest.useFakeTimers();

		const plugin = new PluginController(
			{
				"desktop-wallet": { minimumVersion: "4.0.0" },
				name: "@dated/delegate-calculator-wallet-plugin",
				version: "0.0.1",
			},
			() => void 0,
		);
		manager.plugins().push(plugin);

		const ipcRendererSpy = jest.spyOn(electron.ipcRenderer, "invoke").mockImplementation((channel) => {
			if (channel === "plugin:install") {
				throw new Error();
			}
		});

		const Component = () => {
			const {
				fetchPluginPackages,
				allPlugins,
				updatePlugin,
				checkUpdateStatus,
				updatingStats,
			} = usePluginManagerContext();
			const onClick = () => fetchPluginPackages();

			return (
				<div>
					<button onClick={onClick}>Fetch</button>
					<ul>
						{allPlugins.map((package_) => {
							const updateStatus = checkUpdateStatus(package_.id());

							return (
								<li key={package_.name()}>
									<span>{package_.name()}</span>
									{updatingStats[package_.name()]?.failed ? (
										<span>Updated failed</span>
									) : (
										<>
											{updateStatus.isAvailable ? <span>Update Available</span> : null}
											<button onClick={() => updatePlugin({ id: package_.name() }, profile.id())}>
												Update
											</button>
										</>
									)}
								</li>
							);
						})}
					</ul>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Fetch"));

		await screen.findByText("Update Available");

		userEvent.click(screen.getAllByText("Update")[0]);

		await waitFor(() =>
			expect(manager.plugins().findById("@dated/delegate-calculator-wallet-plugin")?.config().version()).toBe(
				"0.0.1",
			),
		);

		expect(screen.getByText("Updated failed")).toBeInTheDocument();

		ipcRendererSpy.mockRestore();
		jest.useRealTimers();
	});

	it("should filter packages", async () => {
		const plugin = new PluginController({ name: "my-custom-plugin" }, () => void 0);
		manager.plugins().push(plugin);

		const Component = () => {
			const { fetchPluginPackages, searchResults, filterBy } = usePluginManagerContext();
			const onClick = () => fetchPluginPackages();
			return (
				<div>
					<button onClick={onClick}>Click</button>
					{searchResults.length > 0 && (
						<div
							onClick={() => {
								filterBy({ query: "custom" });
							}}
							data-testid="QueryByText"
						/>
					)}

					<ul>
						{searchResults.map((package_) => (
							<li key={package_.name()}>{package_.name()}</li>
						))}
					</ul>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByRole("button"));

		await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3));

		userEvent.click(screen.getByTestId("QueryByText"));
		await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));

		manager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should reset filters", async () => {
		const plugin = new PluginController({ name: "test-plugin" }, () => void 0);
		manager.plugins().push(plugin);

		const Component = () => {
			const { fetchPluginPackages, searchResults, filterBy, resetFilters } = usePluginManagerContext();
			const onClick = () => fetchPluginPackages();
			return (
				<div>
					<button onClick={onClick}>Click</button>
					{searchResults.length > 0 && (
						<div
							onClick={() => {
								filterBy({ query: "Delegate Calculator" });
							}}
							data-testid="QueryByText"
						/>
					)}

					{searchResults.length > 0 && (
						<div
							onClick={() => {
								resetFilters();
							}}
							data-testid="ResetFilters"
						/>
					)}
					<ul>
						{searchResults.map((package_) => (
							<li key={package_.name()}>{package_.name()}</li>
						))}
					</ul>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByRole("button"));

		await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3));

		userEvent.click(screen.getByTestId("QueryByText"));
		await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(1));

		userEvent.click(screen.getByTestId("ResetFilters"));
		await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(3));

		manager.plugins().removeById(plugin.config().id(), profile);
	});

	it("should fetch plugin size", async () => {
		const Component = () => {
			const { fetchPluginPackages, fetchSize, pluginPackages } = usePluginManagerContext();
			const [size, setSize] = useState<string>();

			return (
				<div>
					<button onClick={() => fetchPluginPackages()}>Fetch Plugins</button>
					<button onClick={() => fetchSize(pluginPackages?.[0]?.id()).then(setSize)}>Fetch Size</button>
					<span>Plugins {pluginPackages.length}</span>
					<span>Size {size || "N/A"}</span>
				</div>
			);
		};

		render(
			<EnvironmentProvider env={env}>
				<PluginManagerProvider manager={manager} services={[]}>
					<Component />
				</PluginManagerProvider>
			</EnvironmentProvider>,
		);

		userEvent.click(screen.getByText("Fetch Size"));

		expect(screen.getByText("Size N/A")).toBeInTheDocument();

		userEvent.click(screen.getByText("Fetch Plugins"));
		await screen.findByText("Plugins 2");

		userEvent.click(screen.getByText("Fetch Size"));
		await screen.findByText("Size 122515");
	});
});
