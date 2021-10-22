import { translations as commonTranslations } from "app/i18n/common/i18n";
import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { PluginDropdown } from "./PluginDropdown";

describe("PluginDropdown", () => {
	it("should execute onUpdate callback", () => {
		const onUpdate = jest.fn();

		render(
			<PluginDropdown
				plugin={{
					updateStatus: {
						isAvailable: true,
						isCompatible: true,
					},
				}}
				onUpdate={onUpdate}
			/>,
		);

		expect(screen.getByTestId("PluginDropdown__update-badge")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("dropdown__toggle"));
		fireEvent.click(screen.getByText(commonTranslations.UPDATE));

		expect(onUpdate).toHaveBeenCalled();
	});

	it("should execute onDelete callback", () => {
		const onDelete = jest.fn();

		render(
			<PluginDropdown
				plugin={{
					isInstalled: true,
					updateStatus: {},
				}}
				onDelete={onDelete}
			/>,
		);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));
		fireEvent.click(screen.getByText(commonTranslations.DELETE));

		expect(onDelete).toHaveBeenCalled();
	});

	it("should execute onEnable callback", () => {
		const onEnable = jest.fn();

		render(
			<PluginDropdown
				plugin={{
					isEnabled: false,
					isInstalled: true,
					updateStatus: {},
				}}
				onEnable={onEnable}
			/>,
		);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));
		fireEvent.click(screen.getByText(commonTranslations.ENABLE));

		expect(onEnable).toHaveBeenCalled();
	});

	it("should execute onDisable callback", () => {
		const onDisable = jest.fn();

		render(
			<PluginDropdown
				plugin={{
					isEnabled: true,
					isInstalled: true,
					updateStatus: {},
				}}
				onDisable={onDisable}
			/>,
		);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));
		fireEvent.click(screen.getByText(commonTranslations.DISABLE));

		expect(onDisable).toHaveBeenCalled();
	});
});
