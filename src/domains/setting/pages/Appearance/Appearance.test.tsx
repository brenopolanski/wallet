/* eslint-disable @typescript-eslint/require-await */
import { camelCase } from "@payvo/sdk-helpers";
import { Contracts } from "@payvo/sdk-profiles";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toasts } from "app/services";
import { translations } from "domains/setting/i18n";
import { createMemoryHistory, MemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { AppearanceSettings } from "./Appearance";

describe("Appearance Settings", () => {
	let profile: Contracts.IProfile;
	let history: MemoryHistory;

	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();
	});

	beforeEach(() => {
		history = createMemoryHistory({
			initialEntries: [`/profiles/${profile.id()}/settings/appearance`],
		});
	});

	const renderPage = () =>
		render(
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

	it("should allow to change the accent color", async () => {
		const toastSuccess = jest.spyOn(toasts, "success");

		renderPage();

		const blueRadioButton = screen.getByLabelText(translations.APPEARANCE.OPTIONS.ACCENT_COLOR.COLORS.BLUE);

		expect(blueRadioButton).not.toBeChecked();
		expect(profile.settings().get(Contracts.ProfileSetting.AccentColor)).not.toBe("blue");

		expect(screen.getByTestId("AppearanceFooterButtons__save")).toBeDisabled();

		userEvent.click(blueRadioButton);

		await waitFor(() => {
			expect(blueRadioButton).toBeChecked();
		});

		expect(profile.settings().get(Contracts.ProfileSetting.AccentColor)).not.toBe("blue");

		expect(screen.getByTestId("AppearanceFooterButtons__save")).toBeEnabled();

		userEvent.click(screen.getByTestId("AppearanceFooterButtons__save"));

		await waitFor(() => {
			expect(profile.settings().get(Contracts.ProfileSetting.AccentColor)).toBe("blue");
		});

		expect(toastSuccess).toHaveBeenCalledWith(translations.GENERAL.SUCCESS);
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

		userEvent.click(darkButton);

		await waitFor(() => {
			expect(darkButton).toBeChecked();
		});

		expect(profile.settings().get(Contracts.ProfileSetting.Theme)).not.toBe("dark");

		expect(screen.getByTestId("AppearanceFooterButtons__save")).toBeEnabled();

		userEvent.click(screen.getByTestId("AppearanceFooterButtons__save"));

		await waitFor(() => {
			expect(profile.settings().get(Contracts.ProfileSetting.Theme)).toBe("dark");
		});

		expect(toastSuccess).toHaveBeenCalledWith(translations.GENERAL.SUCCESS);
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

		userEvent.click(screen.getByTestId(toggleTestId));

		await waitFor(() => {
			expect(screen.getByTestId(toggleTestId)).not.toBeChecked();
		});

		expect(profile.settings().get(key)).toBe(true);

		expect(screen.getByTestId("AppearanceFooterButtons__save")).toBeEnabled();

		userEvent.click(screen.getByTestId("AppearanceFooterButtons__save"));

		await waitFor(() => {
			expect(profile.settings().get(key)).toBe(false);
		});

		expect(toastSuccess).toHaveBeenCalledWith(translations.GENERAL.SUCCESS);
	});
});
