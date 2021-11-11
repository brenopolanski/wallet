/* eslint-disable @typescript-eslint/require-await */
import { buildTranslations } from "app/i18n/helpers";
import { toasts } from "app/services";
import nock from "nock";
import { PluginManager } from "plugins";
import { PluginManagerProvider } from "plugins/context/PluginManagerProvider";
import React from "react";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { PluginManualInstallModal } from "./PluginManualInstallModal";

const translations = buildTranslations();

describe("PluginManualInstallModal", () => {
	let manager: PluginManager;

	beforeAll(() => {
		manager = new PluginManager();
	});

	it("should render properly", async () => {
		nock("https://github.com/")
			.get("/arkecosystem/fail-plugin/raw/master/package.json")
			.replyWithError("Failed")
			.get("/arkecosystem/test-plugin/raw/master/package.json")
			.reply(200, { keywords: ["@payvo", "wallet-plugin"], name: "test-plugin" });

		const toastSpy = jest.spyOn(toasts, "error").mockImplementation();

		const onSuccess = jest.fn();

		const { container } = render(
			<PluginManagerProvider manager={manager} services={[]}>
				<PluginManualInstallModal onSuccess={onSuccess} isOpen />
			</PluginManagerProvider>,
		);

		await waitFor(async () => {
			expect(screen.getByTestId("PluginManualInstallModal__submit-button")).toBeDisabled();
		});

		fireEvent.input(screen.getByRole("textbox"), { target: { value: "https://" } });

		await waitFor(async () => {
			expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
		});

		fireEvent.input(screen.getByRole("textbox"), {
			target: { value: "https://github.com/arkecosystem/fail-plugin" },
		});

		await waitFor(async () => {
			expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid", "true");
		});

		await waitFor(async () => {
			expect(screen.getByTestId("PluginManualInstallModal__submit-button")).not.toBeDisabled();
		});

		fireEvent.click(screen.getByTestId("PluginManualInstallModal__submit-button"));

		await waitFor(() =>
			expect(toastSpy).toHaveBeenCalledWith(translations.PLUGINS.MODAL_MANUAL_INSTALL_PLUGIN.ERROR),
		);

		fireEvent.input(screen.getByRole("textbox"), {
			target: { value: "https://github.com/arkecosystem/test-plugin" },
		});

		fireEvent.click(screen.getByTestId("PluginManualInstallModal__submit-button"));

		await waitFor(() =>
			expect(onSuccess).toHaveBeenCalledWith({
				pluginId: "test-plugin",
				repositoryURL: "https://github.com/arkecosystem/test-plugin",
			}),
		);

		expect(container).toMatchSnapshot();
	});
});
