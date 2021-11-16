import userEvent from "@testing-library/user-event";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import React from "react";
import { fireEvent, render, within } from "utils/testing-library";

import { PluginList } from "./PluginList";

const plugins = [
	{
		author: "ARK.io",
		category: "utility",
		id: "ark-explorer",
		isInstalled: false,
		isOfficial: true,
		rating: 4.2,
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
		rating: 3.8,
		size: "163 KB",
		title: "ARK Avatars",
		updateStatus: {
			isAvailable: false,
		},
		version: "1.3.8",
	},
];

describe("PluginList", () => {
	it("should render pagination", () => {
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
		const { asFragment, getAllByTestId, getByTestId } = render(
			<PluginList itemsPerPage={4} plugins={[...plugins, ...morePlugins]} />,
		);

		expect(getAllByTestId("TableRow")).toHaveLength(4);
		expect(getByTestId("Pagination")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render pagination", () => {
		const { asFragment, getAllByTestId, getByTestId } = render(<PluginList plugins={plugins} />);

		expect(getAllByTestId("TableRow")).toHaveLength(2);
		expect(() => getByTestId("Pagination")).toThrow(/Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render without pagination", () => {
		const { asFragment, getAllByTestId, getByTestId } = render(
			<PluginList plugins={plugins} showPagination={false} />,
		);

		expect(getAllByTestId("TableRow")).toHaveLength(2);
		expect(() => getByTestId("Pagination")).toThrow(/Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should split by page", () => {
		const { asFragment, getAllByTestId, getByTestId, getByText } = render(
			<PluginList plugins={plugins} itemsPerPage={1} />,
		);

		expect(getAllByTestId("TableRow")).toHaveLength(1);

		expect(getByText("ARK Explorer")).toBeInTheDocument();
		expect(() => getByText("ARK Avatars")).toThrow(/Unable to find an element with/);

		userEvent.click(getByTestId("Pagination__next"));

		expect(getByText("ARK Avatars")).toBeInTheDocument();
		expect(() => getByText("ARK Explorer")).toThrow(/Unable to find an element with/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should trigger install", () => {
		const onInstall = jest.fn();

		const { asFragment, getAllByTestId } = render(<PluginList plugins={plugins} onInstall={onInstall} />);

		userEvent.click(within(getAllByTestId("TableRow")[1]).getByTestId("PluginListItem__install"));

		expect(onInstall).toHaveBeenCalledTimes(1);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should trigger delete", () => {
		const onDelete = jest.fn();

		const { asFragment, getAllByTestId } = render(<PluginList plugins={plugins} onDelete={onDelete} />);

		userEvent.click(within(getAllByTestId("TableRow")[0]).getByTestId("dropdown__toggle"));
		userEvent.click(within(getAllByTestId("TableRow")[0]).getByText(commonTranslations.DELETE));

		expect(onDelete).toHaveBeenCalledTimes(1);
		expect(asFragment()).toMatchSnapshot();
	});
});
