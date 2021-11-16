import userEvent from "@testing-library/user-event";
import * as useRandomNumberHook from "app/hooks/use-random-number";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { translations as pluginTranslations } from "domains/plugin/i18n";
import React from "react";
import { render, screen } from "utils/testing-library";

import { PluginGrid } from "./PluginGrid";

const plugins = [
	{
		author: "ARK.io",
		category: "utility",
		id: "ark-explorer",
		isInstalled: false,
		isOfficial: true,
		size: "4.2 MB",
		title: "ARK Explorer",
		updateStatus: {
			isAvailable: false,
		},
		version: "1.3.8",
	},
	{
		author: "ARK.io",
		category: "other",
		id: "ark-avatars",
		isInstalled: true,
		size: "163 KB",
		title: "ARK Avatars",
		updateStatus: {
			isAvailable: false,
		},
		version: "1.3.8",
	},
	{
		author: "ARK.io",
		category: "other",
		id: "ark-theme",
		isEnabled: true,
		isInstalled: true,
		size: "163 KB",
		title: "ARK Theme",
		updateStatus: {
			isAvailable: false,
		},
		version: "1.3.8",
	},
];

describe("PluginGrid", () => {
	beforeAll(() => {
		jest.spyOn(useRandomNumberHook, "useRandomNumber").mockImplementation(() => 1);
	});

	afterAll(() => {
		useRandomNumberHook.useRandomNumber.mockRestore();
	});

	it("should render pagination", async () => {
		const morePlugins = [
			{
				author: "Breno Polanski",
				category: "other",
				id: "drakula-theme",
				isEnabled: true,
				isInstalled: true,
				size: "163 KB",
				title: "Drakula Theme",
				updateStatus: {
					isAvailable: false,
				},
				version: "1.3.8",
			},
			{
				author: "ARK.io",
				category: "other",
				id: "avfc-theme",
				isEnabled: true,
				isInstalled: true,
				size: "163 KB",
				title: "Avfc Theme",
				updateStatus: {
					isAvailable: false,
				},
				version: "1.3.8",
			},
			{
				author: "ARK.io",
				category: "other",
				id: "red-snow-theme",
				isEnabled: true,
				isInstalled: true,
				size: "163 KB",
				title: "Red snow theme",
				updateStatus: {
					isAvailable: false,
				},
				version: "1.3.8",
			},
		];
		const { asFragment, findByText, getByTestId } = render(
			<PluginGrid itemsPerPage={4} plugins={[...plugins, ...morePlugins]} />,
		);

		for (const plugin of plugins) {
			await findByText(plugin.title);
		}

		expect(getByTestId("Pagination")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render without plugins", async () => {
		const { asFragment, findByText, getByTestId } = render(<PluginGrid plugins={[]} />);

		expect(getByTestId("PluginGrid__empty-message")).toBeInTheDocument();

		await findByText(pluginTranslations.PAGE_PLUGIN_MANAGER.NO_PLUGINS_AVAILABLE);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render pagination", async () => {
		const { asFragment, findByText, getByTestId } = render(<PluginGrid plugins={plugins} />);

		for (const plugin of plugins) {
			await findByText(plugin.title);
		}

		expect(() => getByTestId("Pagination")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render skeletons", () => {
		const { asFragment, getAllByTestId } = render(<PluginGrid isLoading plugins={[]} />);

		expect(getAllByTestId("PluginCardSkeleton")).toHaveLength(3);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render custom number of skeletons", () => {
		const { asFragment, getAllByTestId } = render(<PluginGrid isLoading skeletonsLimit={3} plugins={[]} />);

		expect(getAllByTestId("PluginCardSkeleton")).toHaveLength(3);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render without pagination", async () => {
		const { asFragment, findByText, getByTestId } = render(<PluginGrid plugins={plugins} showPagination={false} />);

		for (const plugin of plugins) {
			await findByText(plugin.title);
		}

		expect(() => getByTestId("Pagination")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should split by page", async () => {
		const { asFragment, findByText, getByTestId } = render(<PluginGrid plugins={plugins} itemsPerPage={1} />);

		await findByText(plugins[0].title);

		await expect(findByText(plugins[1].title)).rejects.toThrow(/Unable to find an element/);

		userEvent.click(getByTestId("Pagination__next"));

		await findByText(plugins[1].title);

		await expect(findByText(plugins[0].title)).rejects.toThrow(/Unable to find an element/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should trigger select", async () => {
		const onSelect = jest.fn();

		const { findByText } = render(<PluginGrid plugins={plugins} onSelect={onSelect} />);

		userEvent.click(await findByText(plugins[0].title));

		expect(onSelect).toHaveBeenCalledTimes(1);
	});

	it("should trigger update", () => {
		const onUpdate = jest.fn();

		render(
			<PluginGrid
				plugins={[
					{
						...plugins[0],
						isInstalled: true,
						updateStatus: {
							isAvailable: true,
							isCompatible: true,
						},
					},
				]}
				onSelect={jest.fn()}
				onUpdate={onUpdate}
			/>,
		);

		userEvent.click(screen.queryAllByTestId("dropdown__toggle")[0]);
		userEvent.click(screen.getByText(commonTranslations.UPDATE));

		expect(onUpdate).toHaveBeenCalledTimes(1);
	});

	it("should trigger update by addon button", () => {
		const onUpdate = jest.fn();

		const { container } = render(
			<PluginGrid
				plugins={[
					{
						...plugins[0],
						isInstalled: true,
						updateStatus: {
							isAvailable: true,
							isCompatible: true,
						},
					},
				]}
				onSelect={jest.fn()}
				onUpdate={onUpdate}
			/>,
		);

		userEvent.click(screen.getByTestId("PluginCard__update-available"));

		expect(onUpdate).toHaveBeenCalledTimes(1);

		expect(container).toMatchSnapshot();
	});

	it("should trigger delete", () => {
		const onDelete = jest.fn();

		render(<PluginGrid plugins={plugins} onSelect={jest.fn()} onDelete={onDelete} />);

		userEvent.click(screen.queryAllByTestId("dropdown__toggle")[1]);
		userEvent.click(screen.getByText(commonTranslations.DELETE));

		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it("should trigger enable", () => {
		const onEnable = jest.fn();

		render(<PluginGrid plugins={plugins} onSelect={jest.fn()} onEnable={onEnable} />);

		userEvent.click(screen.queryAllByTestId("dropdown__toggle")[1]);
		userEvent.click(screen.getByText(commonTranslations.ENABLE));

		expect(onEnable).toHaveBeenCalledTimes(1);
	});

	it("should trigger disable", () => {
		const onDisable = jest.fn();

		render(<PluginGrid plugins={plugins} onSelect={jest.fn()} onDisable={onDisable} />);

		userEvent.click(screen.queryAllByTestId("dropdown__toggle")[2]);
		userEvent.click(screen.getByText(commonTranslations.DISABLE));

		expect(onDisable).toHaveBeenCalledTimes(1);
	});

	it("should trigger install", () => {
		const onInstall = jest.fn();

		render(<PluginGrid plugins={plugins} onSelect={jest.fn()} onInstall={onInstall} />);

		userEvent.click(screen.queryAllByTestId("dropdown__toggle")[0]);
		userEvent.click(screen.getByText(commonTranslations.INSTALL));

		expect(onInstall).toHaveBeenCalledTimes(1);
	});

	it("should trigger launch", () => {
		const onLaunch = jest.fn();

		render(
			<PluginGrid
				plugins={[{ ...plugins[0], hasLaunch: true, isInstalled: true }]}
				onSelect={jest.fn()}
				onLaunch={onLaunch}
			/>,
		);

		userEvent.click(screen.queryAllByTestId("dropdown__toggle")[0]);
		userEvent.click(screen.getByText(commonTranslations.LAUNCH));

		expect(onLaunch).toHaveBeenCalledTimes(1);
	});
});
