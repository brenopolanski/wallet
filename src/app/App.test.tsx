/* eslint-disable @typescript-eslint/require-await */
import LedgerTransportNodeHID from "@ledgerhq/hw-transport-node-hid-singleton";
import { Bcrypt } from "@payvo/sdk-cryptography";
import { Contracts, Environment } from "@payvo/sdk-profiles";
import { buildTranslations } from "app/i18n/helpers";
import { toasts } from "app/services";
import { translations as errorTranslations } from "domains/error/i18n";
import { translations as profileTranslations } from "domains/profile/i18n";
import React from "react";
import * as utils from "utils/electron-utils";
import {
	act,
	env,
	fireEvent,
	getDefaultPassword,
	getDefaultProfileId,
	getPasswordProtectedProfileId,
	MNEMONICS,
	render,
	waitFor,
} from "utils/testing-library";

import { App, initializeEnvironment } from "./App";

let profile: Contracts.IProfile;
let passwordProtectedProfile: Contracts.IProfile;

const translations = buildTranslations();

describe("App", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		passwordProtectedProfile = env.profiles().findById(getPasswordProtectedProfileId());

		await env.profiles().restore(profile);
		await profile.sync();
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	beforeEach(async () => {
		env.reset();
	});

	it("should render splash screen", async () => {
		process.env.REACT_APP_IS_UNIT = "1";

		const { container, asFragment, findByTestId } = render(<App />, {
			withProviders: false,
		});

		await findByTestId("Splash__text");

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle profile sync error", async () => {
		process.env.REACT_APP_IS_UNIT = "1";
		jest.useFakeTimers();

		const { getAllByTestId, getByTestId, history, findByTestId, findByText } = render(<App />, {
			withProviders: false,
		});

		await findByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE, undefined, { timeout: 2000 });

		expect(history.location.pathname).toBe("/");

		const selectedProfile = env.profiles().findById(profile.id());

		selectedProfile.wallets().push(
			await selectedProfile.walletFactory().fromMnemonicWithBIP39({
				coin: "ARK",
				mnemonic: MNEMONICS[0],
				network: "ark.devnet",
			}),
		);

		selectedProfile.wallets().push(
			await selectedProfile.walletFactory().fromAddress({
				address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
				coin: "ARK",
				network: "ark.mainnet",
			}),
		);

		env.profiles().persist(profile);

		const walletSyncErrorMock = jest
			.spyOn(selectedProfile.wallets().first(), "hasSyncedWithNetwork")
			.mockReturnValue(false);
		const walletRestoreErrorMock = jest
			.spyOn(selectedProfile.wallets().last(), "hasBeenFullyRestored")
			.mockReturnValue(false);
		const profileSyncMock = jest.spyOn(selectedProfile, "sync").mockImplementation(() => {
			throw new Error("sync test");
		});

		fireEvent.click(getAllByTestId("Card")[0]);

		const profileDashboardUrl = `/profiles/${profile.id()}/dashboard`;
		await waitFor(() => expect(history.location.pathname).toBe(profileDashboardUrl));

		act(() => {
			jest.runAllTimers();
		});

		await findByTestId("SyncErrorMessage__retry");

		profileSyncMock.mockRestore();
		fireEvent.click(getByTestId("SyncErrorMessage__retry"));

		act(() => {
			jest.runAllTimers();
		});

		await waitFor(() =>
			expect(() => getByTestId("SyncErrorMessage__retry")).toThrow(/Unable to find an element by/),
		);
		await waitFor(() => expect(history.location.pathname).toBe(profileDashboardUrl));

		walletRestoreErrorMock.mockRestore();
		walletSyncErrorMock.mockRestore();

		jest.useRealTimers();
	});

	it("should close splash screen if not e2e", async () => {
		process.env.REACT_APP_IS_UNIT = "1";

		const { container, asFragment, getByTestId } = render(<App />, { withProviders: false });

		await waitFor(() => expect(() => getByTestId("Splash__text")).toThrow(/^Unable to find an element by/));

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render welcome screen after splash screen", async () => {
		process.env.REACT_APP_IS_E2E = "1";

		const { asFragment, findByText, getByTestId } = render(<App />, { withProviders: false });

		expect(getByTestId("Splash__text")).toBeInTheDocument();

		await findByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render the offline screen if there is no internet connection", async () => {
		process.env.REACT_APP_IS_UNIT = "1";

		jest.spyOn(window.navigator, "onLine", "get").mockReturnValueOnce(false);

		const { asFragment, getByTestId } = render(<App />, { withProviders: false });

		expect(getByTestId("Splash__text")).toBeInTheDocument();

		await waitFor(() => {
			expect(getByTestId("Offline__text")).toHaveTextContent(errorTranslations.OFFLINE.TITLE);
		});

		expect(getByTestId("Offline__text")).toHaveTextContent(errorTranslations.OFFLINE.DESCRIPTION);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render application error if the app fails to boot", async () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => null);

		const environmentSpy = jest.spyOn(Environment.prototype, "boot").mockImplementation(() => {
			throw new Error("failed to boot env");
		});

		process.env.REACT_APP_IS_UNIT = "1";

		const { asFragment, getByTestId } = render(<App />, { withProviders: false });

		await waitFor(() => expect(environmentSpy).toHaveBeenCalledWith());

		await waitFor(() => {
			expect(getByTestId("ApplicationError__text")).toHaveTextContent(errorTranslations.APPLICATION.TITLE);
		});

		expect(getByTestId("ApplicationError__text")).toHaveTextContent(errorTranslations.APPLICATION.DESCRIPTION);
		expect(asFragment()).toMatchSnapshot();

		consoleSpy.mockRestore();
		environmentSpy.mockRestore();
	});

	it("should render mock", async () => {
		process.env.REACT_APP_IS_E2E = "1";

		const { asFragment, getByTestId, findByText } = render(<App />, { withProviders: false });

		expect(getByTestId("Splash__text")).toBeInTheDocument();

		await findByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE);
		await findByText("John Doe");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not migrate profiles", async () => {
		process.env.REACT_APP_IS_E2E = undefined;

		const { asFragment, findByText, getByTestId } = render(<App />, { withProviders: false });

		expect(getByTestId("Splash__text")).toBeInTheDocument();

		await findByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should redirect to root if profile restoration error occurs", async () => {
		process.env.REACT_APP_IS_UNIT = "1";

		const { getAllByTestId, getByTestId, findByText, history } = render(<App />, { withProviders: false });

		await findByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE, undefined, { timeout: 2000 });

		expect(history.location.pathname).toBe("/");

		fireEvent.click(getAllByTestId("Card")[1]);

		await waitFor(() => {
			expect(getByTestId("SignIn__input--password")).toBeInTheDocument();
		});

		fireEvent.input(getByTestId("SignIn__input--password"), { target: { value: "password" } });

		await waitFor(() => {
			expect(getByTestId("SignIn__input--password")).toHaveValue("password");
		});

		const verifyPasswordMock = jest.spyOn(Bcrypt, "verify").mockReturnValue(true);
		const memoryPasswordMock = jest.spyOn(env.profiles().last().password(), "get").mockImplementation(() => {
			throw new Error("password not found");
		});

		const profilePasswordSetMock = jest.spyOn(env.profiles().last().password(), "set").mockImplementation();

		fireEvent.click(getByTestId("SignIn__submit-button"));

		await waitFor(() => expect(profilePasswordSetMock).toHaveBeenCalledWith("password"));
		await waitFor(() => expect(memoryPasswordMock).toHaveBeenCalledWith());
		await waitFor(() => expect(history.location.pathname).toBe("/"), { timeout: 4000 });

		memoryPasswordMock.mockRestore();
		verifyPasswordMock.mockRestore();
		profilePasswordSetMock.mockRestore();
		jest.restoreAllMocks();
	});

	it("should enter profile and show toast message for successful sync", async () => {
		process.env.REACT_APP_IS_UNIT = "1";
		const successToast = jest.spyOn(toasts, "success").mockImplementation();
		const warningToast = jest.spyOn(toasts, "warning").mockImplementation();
		const toastDismiss = jest.spyOn(toasts, "dismiss").mockImplementation();

		const { getAllByTestId, findByText, history } = render(<App />, { withProviders: false });

		await findByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE, undefined, { timeout: 2000 });

		expect(history.location.pathname).toBe("/");

		const selectedProfile = env.profiles().findById(profile.id());

		selectedProfile.wallets().push(
			await selectedProfile.walletFactory().fromMnemonicWithBIP39({
				coin: "ARK",
				mnemonic: MNEMONICS[0],
				network: "ark.devnet",
			}),
		);

		selectedProfile.wallets().push(
			await selectedProfile.walletFactory().fromAddress({
				address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
				coin: "ARK",
				network: "ark.mainnet",
			}),
		);

		env.profiles().persist(profile);

		fireEvent.click(getAllByTestId("Card")[0]);

		const profileDashboardUrl = `/profiles/${profile.id()}/dashboard`;

		await waitFor(() => expect(history.location.pathname).toBe(profileDashboardUrl));

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 500));
		});

		await waitFor(() =>
			expect(warningToast).toHaveBeenCalledWith(translations.COMMON.PROFILE_SYNC_STARTED, { autoClose: false }),
		);
		await waitFor(() => expect(toastDismiss).toHaveBeenCalledWith());
		await waitFor(() => expect(successToast).toHaveBeenCalledWith(translations.COMMON.PROFILE_SYNC_COMPLETED));

		successToast.mockRestore();
		warningToast.mockRestore();
		toastDismiss.mockRestore();
	});

	it.each([false, true])(
		"should set the theme based on system preferences (dark = %s)",
		async (shouldUseDarkColors) => {
			process.env.REACT_APP_IS_UNIT = "1";

			const toastSpy = jest.spyOn(toasts, "dismiss").mockResolvedValue(undefined);
			const utilsSpy = jest.spyOn(utils, "shouldUseDarkColors").mockReturnValue(shouldUseDarkColors);

			const { findByText } = render(<App />, { withProviders: false });

			await findByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE, undefined, { timeout: 2000 });

			expect(document.body).toHaveClass(`theme-${shouldUseDarkColors ? "dark" : "light"}`);

			toastSpy.mockRestore();
			utilsSpy.mockRestore();
		},
	);

	it("should enter profile", async () => {
		process.env.REACT_APP_IS_UNIT = "1";

		const { getAllByTestId, getByTestId, findByText, history } = render(<App />, { withProviders: false });

		await findByText(profileTranslations.PAGE_WELCOME.WITH_PROFILES.TITLE, undefined, { timeout: 2000 });

		await env.profiles().restore(passwordProtectedProfile, getDefaultPassword());

		expect(history.location.pathname).toBe("/");

		fireEvent.click(getAllByTestId("Card")[1]);

		await waitFor(() => {
			expect(getByTestId("SignIn__input--password")).toBeInTheDocument();
		});

		fireEvent.input(getByTestId("SignIn__input--password"), { target: { value: "password" } });

		await waitFor(() => {
			expect(getByTestId("SignIn__input--password")).toHaveValue("password");
		});

		jest.spyOn(toasts, "dismiss").mockResolvedValue(undefined);

		fireEvent.click(getByTestId("SignIn__submit-button"));

		const profileDashboardUrl = `/profiles/${passwordProtectedProfile.id()}/dashboard`;
		await waitFor(() => expect(history.location.pathname).toBe(profileDashboardUrl));
	});

	it("should initialize environment with ledger transport", async () => {
		const transport = await LedgerTransportNodeHID.open();
		let isLedgerTransportNodeHIDCalled = false;

		const transportMock = jest.spyOn(LedgerTransportNodeHID, "open").mockImplementation(async () => {
			isLedgerTransportNodeHIDCalled = true;
			return transport;
		});

		process.env.REACT_APP_IS_UNIT = "1";

		const appEnv = initializeEnvironment();
		const profile = appEnv.profiles().create("John Doe");

		const wallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});

		profile.wallets().push(wallet);

		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockReturnValue(true);
		wallet.ledger().connect();

		expect(isLedgerTransportNodeHIDCalled).toBe(true);

		isLedgerMock.mockRestore();
		transportMock.mockRestore();
	});
});
