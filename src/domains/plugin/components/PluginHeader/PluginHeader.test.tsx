import { translations as commonTranslations } from "app/i18n/common/i18n";
import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { PluginHeader } from "./PluginHeader";

describe("PluginHeader", () => {
	const pluginDataFixture = {
		author: "Payvo",
		category: "Utility",
		size: "4.2 Mb",
		title: "Test Plugin",
		updateStatus: {
			isAvailable: false,
		},
		url: "https://github.com/arkecosystem",
		version: "1.3.8",
	};

	it("should render properly", () => {
		const onInstall = jest.fn();
		const { container } = render(<PluginHeader {...pluginDataFixture} onInstall={onInstall} />);

		expect(screen.getByTestId("PluginHeader__button--install")).toBeInTheDocument();
		expect(screen.getByText("Test Plugin")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("PluginHeader__button--install"));

		expect(onInstall).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
		expect(container).toMatchSnapshot();
	});

	it("should render official icon", () => {
		const plugin = {
			...pluginDataFixture,
			isOfficial: true,
		};

		const { container } = render(<PluginHeader {...plugin} />);

		expect(container).toHaveTextContent("shield-check-mark.svg");
	});

	it("should render updating plugin", () => {
		const { container } = render(<PluginHeader {...pluginDataFixture} updatingStats={{ percent: 0.2 }} />);

		expect(screen.getByTestId("CircularProgressBar__percentage")).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});

	it("should trigger update", () => {
		const onUpdate = jest.fn();

		render(
			<PluginHeader
				{...pluginDataFixture}
				updateStatus={{
					isAvailable: true,
					isCompatible: true,
				}}
				isInstalled
				onUpdate={onUpdate}
			/>,
		);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));
		fireEvent.click(screen.getByText(commonTranslations.UPDATE));

		expect(onUpdate).toHaveBeenCalledWith({
			...pluginDataFixture,
			isInstalled: true,
			updateStatus: {
				isAvailable: true,
				isCompatible: true,
			},
		});
	});

	it("should trigger delete", () => {
		const onDelete = jest.fn();

		render(<PluginHeader {...pluginDataFixture} isInstalled onDelete={onDelete} />);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));
		fireEvent.click(screen.getByText(commonTranslations.DELETE));

		expect(onDelete).toHaveBeenCalledWith({
			...pluginDataFixture,
			isInstalled: true,
		});
	});

	it("should trigger enable", () => {
		const onEnable = jest.fn();

		render(<PluginHeader {...pluginDataFixture} isInstalled onEnable={onEnable} />);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));
		fireEvent.click(screen.getByText(commonTranslations.ENABLE));

		expect(onEnable).toHaveBeenCalledWith({
			...pluginDataFixture,
			isInstalled: true,
		});
	});

	it("should trigger disable", () => {
		const onDisable = jest.fn();

		render(<PluginHeader {...pluginDataFixture} isInstalled isEnabled onDisable={onDisable} />);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));
		fireEvent.click(screen.getByText(commonTranslations.DISABLE));

		expect(onDisable).toHaveBeenCalledWith({
			...pluginDataFixture,
			isEnabled: true,
			isInstalled: true,
		});
	});
});
