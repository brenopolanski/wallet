/* eslint-disable @typescript-eslint/require-await */
import { camelCase } from "@arkecosystem/utils";
import { Contracts } from "@payvo/profiles";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toasts } from "app/services";
import { translations } from "domains/setting/i18n";
import { createMemoryHistory, MemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { act, env, getDefaultProfileId, renderWithRouter } from "utils/testing-library";

import { AppearanceSettings } from "./Appearance";

describe("Appearance Settings", () => {
	let profile: Contracts.IProfile;
	let history: MemoryHistory;
	let historyGoSpy: jest.SpyInstance;

	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();
	});

	beforeEach(() => {
		history = createMemoryHistory({
			initialEntries: [`/profiles/${profile.id()}/settings/appearance`],
		});

		historyGoSpy = jest.spyOn(history, "go").mockImplementation();
	});

	const renderPage = () =>
		renderWithRouter(
			<Route exact={false} path="/profiles/:profileId/settings/:activeSetting">
				<AppearanceSettings />
			</Route>,
			{
				history,
				routes: [`/profiles/${profile.id()}/settings/appearance`],
			},
		);

	it("should render appearance settings", () => {
		const { asFragment } = renderPage();

		expect(screen.getAllByRole("radiogroup")).toHaveLength(2);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should go back when cancel button is clicked", async () => {
		renderPage();

		expect(screen.getByTestId("AppearanceFooterButtons__cancel")).toBeInTheDocument();

		await act(async () => {
			userEvent.click(screen.getByTestId("AppearanceFooterButtons__cancel"));
		});

		expect(historyGoSpy).toHaveBeenCalledTimes(1);
		expect(historyGoSpy).toHaveBeenCalledWith(-1);
	});

	it("should allow to change the accent color", async () => {
		const toastSuccess = jest.spyOn(toasts, "success");

		renderPage();

		const blueRadioButton = screen.getByLabelText(translations.APPEARANCE.OPTIONS.ACCENT_COLOR.COLORS.BLUE);

		expect(blueRadioButton).not.toBeChecked();
		expect(profile.settings().get(Contracts.ProfileSetting.AccentColor)).not.toBe("blue");

		await act(async () => {
			userEvent.click(blueRadioButton);
		});

		expect(blueRadioButton).toBeChecked();
		expect(profile.settings().get(Contracts.ProfileSetting.AccentColor)).not.toBe("blue");

		expect(screen.getByTestId("AppearanceFooterButtons__save")).not.toBeDisabled();

		await act(async () => {
			userEvent.click(screen.getByTestId("AppearanceFooterButtons__save"));
		});

		expect(profile.settings().get(Contracts.ProfileSetting.AccentColor)).toBe("blue");
		expect(toastSuccess).toHaveBeenCalled();
	});

	it("should allow to change the viewing mode", async () => {
		const toastSuccess = jest.spyOn(toasts, "success");

		profile.settings().set(Contracts.ProfileSetting.Theme, "light");

		renderPage();

		const lightButton = within(screen.getAllByRole("radiogroup")[1]).getAllByRole("radio")[0];
		const darkButton = within(screen.getAllByRole("radiogroup")[1]).getAllByRole("radio")[1];

		expect(lightButton).toHaveAttribute("aria-label", "light");
		expect(darkButton).toHaveAttribute("aria-label", "dark");

		expect(lightButton).toBeChecked();

		expect(profile.settings().get(Contracts.ProfileSetting.Theme)).not.toBe("dark");

		await act(async () => {
			userEvent.click(darkButton);
		});

		expect(darkButton).toBeChecked();
		expect(profile.settings().get(Contracts.ProfileSetting.Theme)).not.toBe("dark");

		expect(screen.getByTestId("AppearanceFooterButtons__save")).not.toBeDisabled();

		await act(async () => {
			userEvent.click(screen.getByTestId("AppearanceFooterButtons__save"));
		});

		expect(profile.settings().get(Contracts.ProfileSetting.Theme)).toBe("dark");
		expect(toastSuccess).toHaveBeenCalled();
	});

	it.each([
		Contracts.ProfileSetting.DashboardTransactionHistory,
		Contracts.ProfileSetting.UseNetworkWalletNames,
		Contracts.ProfileSetting.UseExpandedTables,
	])("should allow to toggle %s setting", async (key) => {
		const toastSuccess = jest.spyOn(toasts, "success");

		profile.settings().set(key, true);

		renderPage();

		const toggleTestId = `AppearanceToggle__toggle-${camelCase(key)}`;

		expect(screen.getByTestId(toggleTestId)).toBeChecked();
		expect(profile.settings().get(key)).toBe(true);

		await act(async () => {
			userEvent.click(screen.getByTestId(toggleTestId));
		});

		expect(screen.getByTestId(toggleTestId)).not.toBeChecked();
		expect(profile.settings().get(key)).toBe(true);

		expect(screen.getByTestId("AppearanceFooterButtons__save")).not.toBeDisabled();

		await act(async () => {
			userEvent.click(screen.getByTestId("AppearanceFooterButtons__save"));
		});

		expect(profile.settings().get(key)).toBe(false);
		expect(toastSuccess).toHaveBeenCalled();
	});
});
