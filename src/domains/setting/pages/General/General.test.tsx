/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAccentColor, useTheme } from "app/hooks";
import { buildTranslations } from "app/i18n/helpers";
import { toasts } from "app/services";
import { GeneralSettings } from "domains/setting/pages";
import electron from "electron";
import { createHashHistory } from "history";
import os from "os";
import React from "react";
import { Route } from "react-router-dom";
import { act, env, fireEvent, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

const translations = buildTranslations();

jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useHistory: () => ({
		go: jest.fn(),
		replace: jest.fn(),
	}),
}));

let profile: Contracts.IProfile;
let showOpenDialogMock: jest.SpyInstance;

const showOpenDialogParameters = {
	defaultPath: os.homedir(),
	filters: [{ extensions: ["png", "jpg", "jpeg", "bmp"], name: "" }],
	properties: ["openFile"],
};

jest.mock("fs", () => ({
	readFileSync: jest.fn(() => "avatarImage"),
	writeFileSync: jest.fn(),
}));

describe("General Settings", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();
	});

	it("should render with prompt paths", async () => {
		const history = createHashHistory();

		history.push(`/profiles/${profile.id()}/settings`);

		render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				// @ts-ignore
				history,
			},
		);

		// Idle
		history.push(`/profiles/${profile.id()}/dashboard`);

		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "My Profile" } });

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeEnabled());

		// Dirty
		history.replace(`/profiles/${profile.id()}/dashboard`);

		// Reload
		history.replace(`/profiles/${profile.id()}/settings`);
	});

	it("should render", async () => {
		const { container, asFragment } = render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should disable submit button when profile is not restored yet", async () => {
		const isProfileRestoredMock = jest.spyOn(profile.status(), "isRestored").mockReturnValue(false);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		expect(screen.getByTestId("General-settings__submit-button")).toBeDisabled();
		expect(asFragment()).toMatchSnapshot();

		isProfileRestoredMock.mockRestore();
	});

	it("should update the avatar when removing focus from name input", async () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		expect(screen.getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		act(() => screen.getByTestId("General-settings__input--name").focus());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "" } });
		fireEvent.blur(screen.getByTestId("General-settings__input--name"));

		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "t" } });
		fireEvent.blur(screen.getByTestId("General-settings__input--name"));

		expect(screen.getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();

		act(() => screen.getByTestId("General-settings__input--name").focus());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "" } });

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).not.toHaveValue());

		act(() => screen.getByTestId("General-settings__submit-button").focus());

		act(() => screen.getByTestId("General-settings__input--name").focus());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "" } });

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).not.toHaveValue());

		act(() => screen.getByTestId("General-settings__submit-button").focus());

		expect(() => screen.getByTestId("SelectProfileImage__avatar")).toThrow(/^Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should show identicon when removing image if name is set", async () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: ["banner.png"],
		}));

		// Upload avatar image
		userEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		await waitFor(() => expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters));

		userEvent.click(screen.getByTestId("SelectProfileImage__remove-button"));

		expect(asFragment()).toMatchSnapshot();

		showOpenDialogMock.mockRestore();
	});

	it("should not update the uploaded avatar when removing focus from name input", async () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		// Upload avatar image
		showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: ["banner.png"],
		}));

		userEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		await waitFor(() => {
			expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);
		});

		act(() => screen.getByTestId("General-settings__input--name").focus());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "" } });

		await waitFor(() => {
			expect(screen.getByTestId("General-settings__input--name")).not.toHaveValue();
		});

		fireEvent.blur(screen.getByTestId("General-settings__input--name"));

		expect(screen.getByTestId("SelectProfileImage__avatar-image")).toBeInTheDocument();

		act(() => screen.getByTestId("General-settings__input--name").focus());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "t" } });

		await waitFor(() => {
			expect(screen.getByTestId("General-settings__input--name")).toHaveValue("t");
		});

		fireEvent.blur(screen.getByTestId("General-settings__input--name"));

		expect(screen.getByTestId("SelectProfileImage__avatar-image")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should update profile", async () => {
		const toastSpy = jest.spyOn(toasts, "success");

		const profilesCount = env.profiles().count();

		const { asFragment } = render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		// Upload avatar image
		showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: ["banner.png"],
		}));

		userEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		await waitFor(() => {
			expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);
		});

		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "test profile" } });

		// Toggle Screenshot Protection
		userEvent.click(screen.getByTestId("General-settings__toggle--screenshotProtection"));

		// change auto signout period
		expect(
			within(screen.getByTestId("General-settings__auto-signout")).getByTestId("select-list__input"),
		).toHaveValue("15");

		userEvent.click(
			within(screen.getByTestId("General-settings__auto-signout")).getByTestId("SelectDropdown__caret"),
		);

		const firstOption = within(screen.getByTestId("General-settings__auto-signout")).getByTestId(
			"SelectDropdown__option--0",
		);

		expect(firstOption).toBeInTheDocument();

		fireEvent.mouseDown(firstOption);

		expect(
			within(screen.getByTestId("General-settings__auto-signout")).getByTestId("select-list__input"),
		).toHaveValue("1");

		// Toggle Test Development Network
		userEvent.click(screen.getByTestId("General-settings__toggle--useTestNetworks"));

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.SETTINGS.MODAL_DEVELOPMENT_NETWORK.TITLE,
		);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.SETTINGS.MODAL_DEVELOPMENT_NETWORK.DESCRIPTION,
		);

		userEvent.click(screen.getByTestId("DevelopmentNetwork__continue-button"));

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		// Toggle Test Development Network
		userEvent.click(screen.getByTestId("General-settings__toggle--useTestNetworks"));

		expect(screen.getByTestId("General-settings__submit-button")).toBeEnabled();

		userEvent.click(screen.getByTestId("General-settings__submit-button"));

		await waitFor(() => {
			expect(toastSpy).toHaveBeenCalledWith(translations.SETTINGS.GENERAL.SUCCESS);
		});

		// Upload and remove avatar image
		userEvent.click(screen.getByTestId("SelectProfileImage__remove-button"));

		expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);

		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "t" } });
		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeEnabled());
		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "" } });
		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeDisabled());
		fireEvent.input(screen.getByTestId("General-settings__input--name"), { target: { value: "test profile 2" } });

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeEnabled());

		userEvent.click(screen.getByTestId("General-settings__submit-button"));

		// Not upload avatar image
		showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: undefined,
		}));

		userEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		await waitFor(() => {
			expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters);
		});

		expect(env.profiles().count()).toBe(profilesCount);
		expect(asFragment()).toMatchSnapshot();

		toastSpy.mockRestore();
	});

	it("should not update profile if name consists only of whitespace", async () => {
		render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));
		fireEvent.input(screen.getByTestId("General-settings__input--name"), {
			target: { value: "     " },
		});

		await waitFor(() => {
			expect(screen.getByTestId("Input__error")).toBeVisible();
		});

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeDisabled());
	});

	it("should not update profile if profile name exists", async () => {
		render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		const otherProfile = env
			.profiles()
			.values()
			.find((element: Contracts.IProfile) => element.id() !== profile.id());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), {
			target: { value: otherProfile.settings().get(Contracts.ProfileSetting.Name) },
		});

		await waitFor(() => {
			expect(screen.getByTestId("Input__error")).toBeVisible();
		});

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeDisabled());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), {
			target: { value: "unique profile name" },
		});

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeEnabled());
	});

	it("should not update profile if profile name exists (uppercase)", async () => {
		render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));
		const otherProfile = env
			.profiles()
			.values()
			.find((element: Contracts.IProfile) => element.id() !== profile.id());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), {
			target: { value: otherProfile.settings().get(Contracts.ProfileSetting.Name).toUpperCase() },
		});

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeDisabled());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), {
			target: { value: "unique profile name" },
		});

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeEnabled());
	});

	it("should not update profile if profile name is too long", async () => {
		render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));
		fireEvent.input(screen.getByTestId("General-settings__input--name"), {
			target: { value: "test profile".repeat(10) },
		});

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeDisabled());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), {
			target: { value: "unique profile name" },
		});

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeEnabled());
	});

	it("should not update profile if profile name exists (padded)", async () => {
		render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));
		const otherProfile = env
			.profiles()
			.values()
			.find((element: Contracts.IProfile) => element.id() !== profile.id());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), {
			target: { value: `  ${otherProfile.settings().get(Contracts.ProfileSetting.Name)}  ` },
		});

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeDisabled());

		fireEvent.input(screen.getByTestId("General-settings__input--name"), {
			target: { value: "unique profile name" },
		});

		await waitFor(() => expect(screen.getByTestId("General-settings__submit-button")).toBeEnabled());
	});

	it.each([
		["close", "modal__close-btn"],
		["cancel", "DevelopmentNetwork__cancel-button"],
		["continue", "DevelopmentNetwork__continue-button"],
	])("should open & close development network modal (%s)", async (_, buttonId) => {
		const { container } = render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		expect(container).toBeInTheDocument();

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		userEvent.click(screen.getByTestId("General-settings__toggle--useTestNetworks"));

		expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.SETTINGS.MODAL_DEVELOPMENT_NETWORK.TITLE,
		);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.SETTINGS.MODAL_DEVELOPMENT_NETWORK.DESCRIPTION,
		);

		userEvent.click(screen.getByTestId(buttonId));

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it.each([
		["close", "modal__close-btn"],
		["cancel", "ResetProfile__cancel-button"],
		["reset", "ResetProfile__submit-button"],
	])("should open & close reset profile modal (%s)", async (_, buttonId) => {
		const { container } = render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		expect(container).toBeInTheDocument();

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		userEvent.click(screen.getByText(translations.COMMON.RESET_SETTINGS));

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		});

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.PROFILE.MODAL_RESET_PROFILE.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.PROFILE.MODAL_RESET_PROFILE.DESCRIPTION,
		);

		userEvent.click(screen.getByTestId(buttonId));

		await waitFor(() => {
			expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		});
	});

	it("should reset fields on reset", async () => {
		const toastSpy = jest.spyOn(toasts, "success");

		render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("General-settings__input--name")).toHaveValue(profile.name()));

		await waitFor(() => {
			expect(screen.getByTestId("General-settings__submit-button")).toBeEnabled();
		});

		userEvent.click(screen.getByTestId("General-settings__submit-button"));

		await waitFor(() => {
			expect(screen.getByText(translations.COMMON.RESET_SETTINGS)).toBeInTheDocument();
		});

		userEvent.click(screen.getByText(translations.COMMON.RESET_SETTINGS));

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		});

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.PROFILE.MODAL_RESET_PROFILE.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.PROFILE.MODAL_RESET_PROFILE.DESCRIPTION,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ResetProfile__submit-button")).toBeEnabled();
		});

		userEvent.click(screen.getByTestId("ResetProfile__submit-button"));

		await waitFor(() => {
			expect(toastSpy).toHaveBeenCalledWith(translations.SETTINGS.GENERAL.SUCCESS);
		});

		toastSpy.mockRestore();
	});

	it("should reset appearance settings on reset", async () => {
		const toastSpy = jest.spyOn(toasts, "success");
		const { setAccentColor, getCurrentAccentColor } = useAccentColor();

		expect(getCurrentAccentColor()).toBe("green");
		expect(electron.remote.nativeTheme.themeSource).not.toBe("dark");

		setAccentColor("blue");
		useTheme().setTheme("dark");

		expect(getCurrentAccentColor()).toBe("blue");
		expect(electron.remote.nativeTheme.themeSource).toBe("dark");

		render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		await waitFor(() => {
			expect(screen.getByText(translations.COMMON.RESET_SETTINGS)).toBeInTheDocument();
		});

		userEvent.click(screen.getByText(translations.COMMON.RESET_SETTINGS));

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toBeInTheDocument();
		});

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.PROFILE.MODAL_RESET_PROFILE.TITLE);
		expect(screen.getByTestId("modal__inner")).toHaveTextContent(
			translations.PROFILE.MODAL_RESET_PROFILE.DESCRIPTION,
		);

		await waitFor(() => {
			expect(screen.getByTestId("ResetProfile__submit-button")).toBeEnabled();
		});

		userEvent.click(screen.getByTestId("ResetProfile__submit-button"));

		await waitFor(() => {
			expect(toastSpy).toHaveBeenCalledWith(translations.PROFILE.MODAL_RESET_PROFILE.SUCCESS);
		});

		expect(getCurrentAccentColor()).toBe("green");
		expect(electron.remote.nativeTheme.themeSource).toBe("system");

		toastSpy.mockRestore();
	});

	it("should default to USD if market provider does not support the selected currency", async () => {
		const toastSpy = jest.spyOn(toasts, "warning").mockImplementation();

		render(
			<Route path="/profiles/:profileId/settings">
				<GeneralSettings />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/settings`],
			},
		);

		const getSelectInput = (type: "MARKET_PROVIDER" | "CURRENCY") =>
			screen.getByPlaceholderText(
				translations.COMMON.SELECT_OPTION.replace(`{{option}}`, translations.SETTINGS.GENERAL.PERSONAL[type]),
			);

		expect(getSelectInput("MARKET_PROVIDER")).toHaveValue("CryptoCompare");
		expect(getSelectInput("CURRENCY")).toHaveValue("BTC (Ƀ)");

		userEvent.click(
			within((getSelectInput("CURRENCY") as any).parentNode.parentNode).getByTestId("SelectDropdown__caret"),
		);

		await screen.findByText("EUR (€)");

		expect(() => screen.getByText("VND (₫)")).toThrow(/Unable to find an element/);

		userEvent.click(screen.getByText("EUR (€)"));

		await waitFor(() => expect(getSelectInput("CURRENCY")).toHaveValue("EUR (€)"));

		userEvent.click(
			within((getSelectInput("MARKET_PROVIDER") as any).parentNode.parentNode).getByTestId(
				"SelectDropdown__caret",
			),
		);

		userEvent.click(screen.getByText("CoinGecko"));

		await waitFor(() => expect(getSelectInput("MARKET_PROVIDER")).toHaveValue("CoinGecko"));

		userEvent.click(
			within((getSelectInput("CURRENCY") as any).parentNode.parentNode).getByTestId("SelectDropdown__caret"),
		);

		await screen.findByText("VND (₫)");

		userEvent.click(screen.getByText("VND (₫)"));

		await waitFor(() => expect(getSelectInput("CURRENCY")).toHaveValue("VND (₫)"));

		userEvent.click(
			within((getSelectInput("MARKET_PROVIDER") as any).parentNode.parentNode).getByTestId(
				"SelectDropdown__caret",
			),
		);

		userEvent.click(screen.getByText("CryptoCompare"));

		await waitFor(() => expect(getSelectInput("MARKET_PROVIDER")).toHaveValue("CryptoCompare"));

		expect(toastSpy).toHaveBeenCalledWith(
			translations.SETTINGS.GENERAL.UNSUPPORTED_CURRENCY.replace("{{currency}}", "VND").replace(
				"{{provider}}",
				"CryptoCompare",
			),
		);

		expect(getSelectInput("CURRENCY")).toHaveValue("USD ($)");

		toastSpy.mockRestore();
	});
});
