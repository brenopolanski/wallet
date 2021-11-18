import userEvent from "@testing-library/user-event";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { translations as pluginTranslations } from "domains/plugin/i18n";
import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { BlankPluginCard, PluginCard } from "./PluginCard";

const basePlugin = {
	author: "ARK.io",
	category: "utility",
	id: "ark-explorer",
	size: "4.2 MB",
	title: "ARK Explorer",
	updateStatus: {},
	version: "1.3.8",
};

describe("PluginCard", () => {
	it("should render", () => {
		const plugin = {
			...basePlugin,
			isInstalled: false,
		};

		const { asFragment } = render(<PluginCard plugin={plugin} />);

		expect(screen.getByText(plugin.title)).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render without category", () => {
		const plugin = {
			...basePlugin,
			isInstalled: false,
		};

		const { asFragment } = render(<PluginCard plugin={plugin} showCategory={false} />);

		expect(screen.getByText(plugin.title)).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should trigger view", () => {
		const plugin = {
			...basePlugin,
			isInstalled: true,
		};

		const onClick = jest.fn();

		const { asFragment } = render(<PluginCard plugin={plugin} onClick={onClick} />);

		userEvent.click(screen.getByTestId("Card"));

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render official icon", () => {
		const plugin = {
			...basePlugin,
			isInstalled: false,
			isOfficial: true,
		};

		const { asFragment, container } = render(<PluginCard plugin={plugin} />);

		expect(container).toHaveTextContent("shield-check-mark.svg");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render alert icon", () => {
		const plugin = {
			...basePlugin,
			isInstalled: true,
			updateStatus: {
				isAvailable: true,
				isCompatible: false,
			},
		};

		const { asFragment, container } = render(<PluginCard plugin={plugin} />);

		expect(container).toHaveTextContent("circle-exclamation-mark.svg");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render update icon", () => {
		const plugin = {
			...basePlugin,
			isInstalled: true,
			updateStatus: {
				isAvailable: true,
				isCompatible: true,
			},
		};

		const { asFragment, container } = render(<PluginCard plugin={plugin} />);

		expect(container).toHaveTextContent("arrows-rotate.svg");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should call onSelect callback on update icon click", () => {
		const onSelect = jest.fn();

		const plugin = {
			...basePlugin,
			isInstalled: true,
			updateStatus: {
				isAvailable: true,
				isCompatible: true,
			},
		};

		render(<PluginCard plugin={plugin} onSelect={onSelect} />);

		userEvent.click(screen.getByText("arrows-rotate.svg"));

		expect(onSelect).toHaveBeenCalledWith({ label: "Update", value: "update" });
	});

	it.each([
		["space", { key: " ", keyCode: 32 }],
		["enter", { key: "Enter", keyCode: 13 }],
	])("should call onSelect callback on update icon keypress (%s)", (_, key) => {
		const onSelect = jest.fn();

		const plugin = {
			...basePlugin,
			isInstalled: true,
			updateStatus: {
				isAvailable: true,
				isCompatible: true,
			},
		};

		render(<PluginCard plugin={plugin} onSelect={onSelect} />);

		fireEvent.keyDown(screen.getByText("arrows-rotate.svg"), key);

		expect(onSelect).toHaveBeenCalledWith({ label: "Update", value: "update" });
	});

	it("should not call onSelect callback on update icon keypress", () => {
		const onSelect = jest.fn();

		const plugin = {
			...basePlugin,
			isInstalled: true,
			updateStatus: {
				isAvailable: true,
				isCompatible: true,
			},
		};

		render(<PluginCard plugin={plugin} onSelect={onSelect} />);

		fireEvent.keyDown(screen.getByText("arrows-rotate.svg"), { key: "Escape", keyCode: 27 });

		expect(onSelect).not.toHaveBeenCalled();
	});
});

describe("BlankPluginCard", () => {
	it("should render", () => {
		const { asFragment } = render(<BlankPluginCard />);

		expect(screen.getByText(commonTranslations.AUTHOR)).toBeInTheDocument();
		expect(screen.getByText(commonTranslations.NAME)).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with name", () => {
		const { asFragment } = render(<BlankPluginCard name="test-name" />);

		expect(screen.getByText(commonTranslations.AUTHOR)).toBeInTheDocument();
		expect(screen.getByText("test-name")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with category", () => {
		const { asFragment } = render(<BlankPluginCard category="other" />);

		expect(screen.getByText(commonTranslations.AUTHOR)).toBeInTheDocument();
		expect(screen.getByText(pluginTranslations.CATEGORIES.OTHER)).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});
});
