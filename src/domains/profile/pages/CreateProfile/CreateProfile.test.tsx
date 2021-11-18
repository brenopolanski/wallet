/* eslint-disable @typescript-eslint/require-await */
import { ARK } from "@payvo/sdk-ark";
import userEvent from "@testing-library/user-event";
import { httpClient } from "app/services";
import electron from "electron";
import { getCurrency } from "locale-currency";
import os from "os";
import React from "react";
import { StubStorage } from "tests/mocks";
import * as utils from "utils/electron-utils";
import { act, env, fireEvent, render, screen, waitFor } from "utils/testing-library";

import { CreateProfile } from "./CreateProfile";

jest.mock("fs", () => ({
	readFileSync: jest.fn(() => "avatarImage"),
}));

jest.mock("locale-currency", () => ({
	getCurrency: jest.fn(() => "USD"),
}));

let showOpenDialogMock: jest.SpyInstance;

const showOpenDialogParameters = {
	defaultPath: os.homedir(),
	filters: [{ extensions: ["png", "jpg", "jpeg", "bmp"], name: "" }],
	properties: ["openFile"],
};

const baseSettings = {
	ACCENT_COLOR: "green",
	ADVANCED_MODE: false,
	AUTOMATIC_SIGN_OUT_PERIOD: 15,
	BIP39_LOCALE: "english",
	DASHBOARD_TRANSACTION_HISTORY: true,
	DO_NOT_SHOW_FEE_WARNING: false,
	ERROR_REPORTING: false,
	EXCHANGE_CURRENCY: "BTC",
	LOCALE: "en-US",
	MARKET_PROVIDER: "cryptocompare",
	NAME: "test profile",
	SCREENSHOT_PROTECTION: true,
	THEME: "dark",
	TIME_FORMAT: "h:mm A",
	USE_EXPANDED_TABLES: false,
	USE_NETWORK_WALLET_NAMES: false,
	USE_TEST_NETWORKS: false,
};

const renderComponent = async () => {
	const utils = render(<CreateProfile />);

	await waitFor(() => expect(utils.getByTestId("CreateProfile__submit-button")).toBeDisabled());

	return utils;
};

jest.mock("fs", () => ({
	readFileSync: jest.fn(() => "avatarImage"),
}));

const BASE64_REGEX = /(?:[\d+/A-Za-z]{4})*(?:[\d+/A-Za-z]{2}==|[\d+/A-Za-z]{3}=)?/g;

describe("CreateProfile", () => {
	beforeAll(() => {
		env.reset({ coins: { ARK }, httpClient, storage: new StubStorage() });
	});

	beforeEach(() => {
		showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: ["banner.png"],
		}));
	});

	it("should render", async () => {
		const { asFragment } = await renderComponent();

		userEvent.click(screen.getByText("Back"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select currency based on locale", async () => {
		getCurrency.mockReturnValueOnce("EUR");

		await renderComponent();

		await waitFor(() => expect(screen.getByTestId("SelectDropdown__input")).toHaveValue("EUR (€)"));
	});

	it("should fall back USD if currency is not available", async () => {
		getCurrency.mockReturnValueOnce("FOOBAR");

		await renderComponent();

		expect(screen.getByTestId("SelectDropdown__input")).toHaveValue("USD ($)");
	});

	it("should store profile", async () => {
		await renderComponent();

		// Upload avatar image
		userEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		await waitFor(() => expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters));

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile 1" } });

		const selectDropdown = screen.getByTestId("SelectDropdown__input");

		fireEvent.change(selectDropdown, { target: { value: "" } });
		await waitFor(() => expect(selectDropdown).not.toHaveValue());

		fireEvent.change(selectDropdown, { target: { value: "BTC" } });
		await waitFor(() => expect(selectDropdown).toHaveValue("BTC"));

		userEvent.click(screen.getByTestId("SelectDropdown__option--0"));

		userEvent.click(screen.getByRole("checkbox"));

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toBeEnabled());

		userEvent.click(screen.getByTestId("CreateProfile__submit-button"));

		await waitFor(() => expect(env.profiles().count()).toBe(1));

		const profile = env.profiles().first();

		expect(profile.name()).toBe("test profile 1");
		expect(profile.settings().all()).toStrictEqual({
			...baseSettings,
			AVATAR: expect.stringMatching(BASE64_REGEX),
			NAME: "test profile 1",
			THEME: "light",
		});
		expect(profile.usesPassword()).toBe(false);
	});

	it("should not be able to create new profile if name already exists", async () => {
		const name = "test profile";
		const profile = env.profiles().create(name);

		await renderComponent();

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "t" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: name } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(screen.getByTestId("Input__error")).toBeVisible();

		env.profiles().forget(profile.id());
	});

	it("should not be able to create new profile if name consists only of whitespace", async () => {
		await renderComponent();

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "t" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "     " } });

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "     " } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(screen.getByTestId("Input__error")).toBeVisible();
	});

	it("should not be able to create new profile if name is too long", async () => {
		await renderComponent();

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "t" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile".repeat(10) } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(screen.getByTestId("Input__error")).toBeVisible();
	});

	it("should store profile with password", async () => {
		await renderComponent();

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile 3" } });
		fireEvent.input(screen.getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword.test" } });
		fireEvent.input(screen.getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword.test" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toBeEnabled());

		userEvent.click(screen.getByTestId("CreateProfile__submit-button"));

		await waitFor(() => expect(env.profiles().last().usesPassword()).toBe(true));
	});

	it("should fail password confirmation", async () => {
		await renderComponent();

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "asdasdas" } });

		fireEvent.change(screen.getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword.test" } });
		fireEvent.change(screen.getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword.wrong" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		fireEvent.input(screen.getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword" } });
		fireEvent.input(screen.getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).not.toHaveAttribute("disabled"));

		fireEvent.input(screen.getAllByTestId("InputPassword")[1], { target: { value: "S3cUrePa$sword.test" } });
		fireEvent.input(screen.getAllByTestId("InputPassword")[0], { target: { value: "S3cUrePa$sword.wrong" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toHaveAttribute("disabled"));

		expect(screen.getByTestId("Input__error")).toBeVisible();
	});

	it("should update the avatar when removing focus from name input", async () => {
		const { asFragment } = await renderComponent();

		expect(() => screen.getByTestId("SelectProfileImage__avatar-identicon")).toThrow(
			/^Unable to find an element by/,
		);

		act(() => screen.getAllByTestId("Input")[0].focus());

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "t" } });
		await waitFor(() => expect(screen.getAllByTestId("Input")[0]).toHaveValue("t"));

		fireEvent.blur(screen.getAllByTestId("Input")[0]);

		expect(screen.getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		act(() => screen.getAllByTestId("Input")[0].focus());

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile" } });
		await waitFor(() => expect(screen.getAllByTestId("Input")[0]).toHaveValue("test profile"));

		fireEvent.blur(screen.getAllByTestId("Input")[0]);

		expect(screen.getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();

		act(() => screen.getAllByTestId("Input")[0].focus());

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "" } });
		await waitFor(() => expect(screen.getAllByTestId("Input")[0]).not.toHaveValue());

		fireEvent.blur(screen.getAllByTestId("Input")[0]);

		expect(() => screen.getByTestId("SelectProfileImage__avatar-identicon")).toThrow(
			/^Unable to find an element by/,
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not update the uploaded avatar when removing focus from name input", async () => {
		await renderComponent();

		// Upload avatar image
		userEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		await waitFor(() => expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters));

		act(() => screen.getAllByTestId("Input")[0].focus());

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "" } });

		await waitFor(() => expect(screen.getAllByTestId("Input")[0]).not.toHaveValue());

		act(() => screen.getAllByTestId("InputPassword")[1].focus());

		expect(screen.getByTestId("SelectProfileImage__avatar-image")).toBeInTheDocument();
	});

	it("should upload and remove avatar image", async () => {
		await renderComponent();

		const profileCount = env.profiles().count();

		// Upload avatar image
		userEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		await waitFor(() => expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters));

		userEvent.click(screen.getByTestId("SelectProfileImage__remove-button"));

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile 4" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toBeEnabled());

		userEvent.click(screen.getByTestId("CreateProfile__submit-button"));

		await waitFor(() => expect(env.profiles().count()).toBe(profileCount + 1));
	});

	it("should show identicon when removing image if name is set", async () => {
		await renderComponent();

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile 1" } });

		// Upload avatar image
		userEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));

		await waitFor(() => expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters));

		userEvent.click(screen.getByTestId("SelectProfileImage__remove-button"));

		expect(screen.getByTestId("SelectProfileImage__avatar-identicon")).toBeInTheDocument();
	});

	it("should not upload avatar image", async () => {
		await renderComponent();

		const profileCount = env.profiles().count();

		// Not upload avatar image
		showOpenDialogMock = jest.spyOn(electron.remote.dialog, "showOpenDialog").mockImplementation(() => ({
			filePaths: undefined,
		}));

		userEvent.click(screen.getByTestId("SelectProfileImage__upload-button"));
		await waitFor(() => expect(showOpenDialogMock).toHaveBeenCalledWith(showOpenDialogParameters));

		fireEvent.input(screen.getAllByTestId("Input")[0], { target: { value: "test profile 5" } });

		await waitFor(() => expect(screen.getByTestId("CreateProfile__submit-button")).toBeEnabled());

		userEvent.click(screen.getByTestId("CreateProfile__submit-button"));

		await waitFor(() => expect(env.profiles().count()).toBe(profileCount + 1));
	});

	it.each([true, false])("should set dark mode toggle based on system preferences", async (shouldUseDarkColors) => {
		const shouldUseDarkColorsSpy = jest.spyOn(utils, "shouldUseDarkColors").mockReturnValue(shouldUseDarkColors);

		await renderComponent();

		const toggle = screen.getByRole("checkbox");

		if (shouldUseDarkColors) {
			expect(toggle).toBeChecked();
		} else {
			expect(toggle).not.toBeChecked();
		}

		expect(document.body).toHaveClass(`theme-${shouldUseDarkColors ? "dark" : "light"}`);

		shouldUseDarkColorsSpy.mockRestore();
	});
});
