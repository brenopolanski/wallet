/* eslint-disable @typescript-eslint/require-await */
import { BIP39 } from "@payvo/cryptography";
import { Contracts } from "@payvo/profiles";
import userEvent from "@testing-library/user-event";
import { translations as walletTranslations } from "domains/wallet/i18n";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, fireEvent, getDefaultProfileId, render, screen, waitFor, within } from "utils/testing-library";

import { CreateWallet } from "./CreateWallet";

jest.setTimeout(30_000);

let profile: Contracts.IProfile;
let bip39GenerateMock: any;

const fixtureProfileId = getDefaultProfileId();
const passphrase = "power return attend drink piece found tragic fire liar page disease combine";

describe("CreateWallet", () => {
	beforeAll(() => {
		bip39GenerateMock = jest.spyOn(BIP39, "generate").mockReturnValue(passphrase);
	});

	afterAll(() => {
		bip39GenerateMock.mockRestore();
	});

	beforeEach(() => {
		profile = env.profiles().findById(fixtureProfileId);

		for (const wallet of profile.wallets().values()) {
			profile.wallets().forget(wallet.id());
		}

		bip39GenerateMock = jest.spyOn(BIP39, "generate").mockReturnValue(passphrase);
	});

	afterEach(() => {
		bip39GenerateMock.mockRestore();
	});

	it("should create a wallet", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL],
			},
		);

		await screen.findByTestId("NetworkStep");

		expect(asFragment()).toMatchSnapshot();

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");
		const continueButton = screen.getByTestId("CreateWallet__continue-button");
		const backButton = screen.getByTestId("CreateWallet__back-button");

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		expect(backButton).toBeEnabled();

		userEvent.click(backButton);

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/dashboard`);

		fireEvent.change(selectNetworkInput, { target: { value: "ARK Dev" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		await waitFor(() => expect(selectNetworkInput).toHaveValue("ARK Devnet"));

		expect(continueButton).toBeEnabled();

		fireEvent.change(selectNetworkInput, { target: { value: "" } });
		await waitFor(() => expect(selectNetworkInput).not.toHaveValue());

		expect(continueButton).toBeDisabled();

		fireEvent.change(selectNetworkInput, { target: { value: "ARK Dev" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		await waitFor(() => expect(selectNetworkInput).toHaveValue("ARK Devnet"));

		expect(continueButton).toBeEnabled();

		userEvent.click(continueButton);

		await waitFor(() => expect(profile.wallets().values()).toHaveLength(0));

		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		userEvent.click(backButton);
		await screen.findByTestId("NetworkStep");

		userEvent.click(continueButton);
		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		userEvent.click(continueButton);
		await screen.findByTestId("CreateWallet__ConfirmPassphraseStep");

		userEvent.click(backButton);

		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		userEvent.click(continueButton);
		await screen.findByTestId("CreateWallet__ConfirmPassphraseStep");

		const walletMnemonic = passphrase.split(" ");
		for (let index = 0; index < 3; index++) {
			const wordNumber = Number.parseInt(screen.getByText(/Select the/).innerHTML.replace(/Select the/, ""));

			userEvent.click(screen.getByText(walletMnemonic[wordNumber - 1]));
			if (index < 2) {
				await waitFor(() => expect(screen.queryAllByText(/The #(\d+) word/).length === 2 - index));
			}
		}
		await waitFor(() => expect(continueButton).toBeEnabled());

		expect(profile.wallets().values()).toHaveLength(0);

		userEvent.click(continueButton);

		await screen.findByTestId("CreateWallet__SuccessStep");

		expect(profile.wallets().values()).toHaveLength(1);

		userEvent.click(screen.getByTestId("CreateWallet__edit-alias"));

		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("UpdateWalletName__input"), { target: { value: "test alias" } });

		await waitFor(() => expect(screen.getByTestId("UpdateWalletName__submit")).toBeEnabled());

		userEvent.click(screen.getByTestId("UpdateWalletName__submit"));

		await waitFor(() => expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/));

		userEvent.click(screen.getByTestId("CreateWallet__finish-button"));

		const wallet = profile.wallets().first();

		expect(wallet.alias()).toBe("test alias");

		await waitFor(() =>
			expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`),
		);

		expect(asFragment()).toMatchSnapshot();

		historySpy.mockRestore();
	});

	it("should create a wallet with encryption", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL],
			},
		);

		await screen.findByTestId("NetworkStep");

		expect(asFragment()).toMatchSnapshot();

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");
		const continueButton = screen.getByTestId("CreateWallet__continue-button");
		const backButton = screen.getByTestId("CreateWallet__back-button");

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		expect(backButton).toBeEnabled();

		userEvent.click(backButton);

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/dashboard`);

		fireEvent.change(selectNetworkInput, { target: { value: "ARK Dev" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		await waitFor(() => expect(selectNetworkInput).toHaveValue("ARK Devnet"));

		expect(continueButton).toBeEnabled();

		fireEvent.change(selectNetworkInput, { target: { value: "" } });
		await waitFor(() => expect(selectNetworkInput).not.toHaveValue());

		expect(continueButton).toBeDisabled();

		fireEvent.change(selectNetworkInput, { target: { value: "ARK Dev" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		await waitFor(() => expect(selectNetworkInput).toHaveValue("ARK Devnet"));

		expect(continueButton).toBeEnabled();

		userEvent.click(continueButton);

		await waitFor(() => expect(profile.wallets().values()).toHaveLength(0));

		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		userEvent.click(backButton);
		await screen.findByTestId("NetworkStep");

		userEvent.click(continueButton);
		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		const steps = within(screen.getByTestId("Form")).getAllByRole("list")[0];

		expect(within(steps).getAllByRole("listitem")).toHaveLength(4);

		userEvent.click(screen.getByTestId("CreateWallet__encryption-toggle"));

		expect(within(steps).getAllByRole("listitem")).toHaveLength(5);

		userEvent.click(continueButton);
		await screen.findByTestId("CreateWallet__ConfirmPassphraseStep");

		userEvent.click(backButton);

		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		userEvent.click(continueButton);
		await screen.findByTestId("CreateWallet__ConfirmPassphraseStep");

		const walletMnemonic = passphrase.split(" ");
		for (let index = 0; index < 3; index++) {
			const wordNumber = Number.parseInt(screen.getByText(/Select the/).innerHTML.replace(/Select the/, ""));

			userEvent.click(screen.getByText(walletMnemonic[wordNumber - 1]));
			if (index < 2) {
				await waitFor(() => expect(screen.queryAllByText(/The #(\d+) word/).length === 2 - index));
			}
		}
		await waitFor(() => expect(continueButton).toBeEnabled());

		userEvent.click(continueButton);

		await screen.findByTestId("EncryptPassword");

		expect(screen.getAllByTestId("InputPassword")).toHaveLength(2);

		fireEvent.input(screen.getAllByTestId("InputPassword")[0], {
			target: {
				value: "S3cUrePa$sword",
			},
		});

		fireEvent.input(screen.getAllByTestId("InputPassword")[1], {
			target: {
				value: "S3cUrePa$sword",
			},
		});

		const continueEncryptionButton = screen.getByTestId("CreateWallet__continue-encryption-button");

		await waitFor(() => expect(continueEncryptionButton).toBeEnabled());

		userEvent.click(continueEncryptionButton);

		await screen.findByTestId("CreateWallet__SuccessStep");

		expect(profile.wallets().values()).toHaveLength(1);

		userEvent.click(screen.getByTestId("CreateWallet__finish-button"));

		const wallet = profile.wallets().first();

		expect(wallet.alias()).toBe("ARK Devnet #1");

		await waitFor(() =>
			expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`),
		);

		expect(asFragment()).toMatchSnapshot();

		historySpy.mockRestore();
	});

	it("should not have a pending wallet if leaving on step 1", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL, "/"],
			},
		);
		await screen.findByTestId("NetworkStep");

		history.push("/");
		await waitFor(() => expect(profile.wallets().values()).toHaveLength(0));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should remove pending wallet if not submitted", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL, "/"],
			},
		);
		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");
		const continueButton = screen.getByTestId("CreateWallet__continue-button");

		expect(asFragment()).toMatchSnapshot();

		fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		await waitFor(() => expect(continueButton).toBeEnabled());

		userEvent.click(continueButton);

		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		userEvent.click(screen.getByTestId("CreateWallet__back-button"));

		await screen.findByTestId("NetworkStep");

		userEvent.click(continueButton);

		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		history.push("/");

		await waitFor(() => expect(profile.wallets().values()).toHaveLength(0));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should show an error message if wallet generation failed", async () => {
		bip39GenerateMock.mockRestore();
		bip39GenerateMock = jest.spyOn(BIP39, "generate").mockImplementation(() => {
			throw new Error("test");
		});

		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL, "/"],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(selectNetworkInput, { target: { value: "ARK D" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		expect(selectNetworkInput).toHaveValue("ARK Devnet");

		const continueButton = screen.getByTestId("CreateWallet__continue-button");

		await waitFor(() => {
			expect(continueButton).toBeEnabled();
		});

		userEvent.click(continueButton);

		await screen.findByText(walletTranslations.PAGE_CREATE_WALLET.NETWORK_STEP.GENERATION_ERROR);

		expect(asFragment()).toMatchSnapshot();

		bip39GenerateMock.mockRestore();
	});

	it("should show an error message for duplicate name", async () => {
		const wallet = await profile.walletFactory().fromAddress({
			address: "D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
			coin: "ARK",
			network: "ark.devnet",
		});

		profile.wallets().push(wallet);
		wallet.settings().set(Contracts.WalletSetting.Alias, "Test");

		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL],
			},
		);

		await screen.findByTestId("NetworkStep");

		expect(asFragment()).toMatchSnapshot();

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");
		const continueButton = screen.getByTestId("CreateWallet__continue-button");

		fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		await waitFor(() => expect(continueButton).toBeEnabled());

		fireEvent.change(selectNetworkInput, { target: { value: "" } });

		await waitFor(() => expect(continueButton).toBeDisabled());

		fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		await waitFor(() => expect(continueButton).toBeEnabled());

		userEvent.click(continueButton);

		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		userEvent.click(continueButton);

		await screen.findByTestId("CreateWallet__ConfirmPassphraseStep");

		const walletMnemonic = passphrase.split(" ");
		for (let index = 0; index < 3; index++) {
			const wordNumber = Number.parseInt(screen.getByText(/Select the/).innerHTML.replace(/Select the/, ""));

			userEvent.click(screen.getByText(walletMnemonic[wordNumber - 1]));
			if (index < 2) {
				await waitFor(() => expect(screen.queryAllByText(/The #(\d+) word/).length === 2 - index));
			}
		}
		await waitFor(() => expect(continueButton).toBeEnabled());

		userEvent.click(continueButton);

		await screen.findByTestId("CreateWallet__SuccessStep");

		userEvent.click(screen.getByTestId("CreateWallet__edit-alias"));

		await screen.findByTestId("modal__inner");

		fireEvent.input(screen.getByTestId("UpdateWalletName__input"), { target: { value: "Test" } });

		await waitFor(() => expect(screen.getByTestId("UpdateWalletName__submit")).toBeDisabled());

		userEvent.click(screen.getByTestId("UpdateWalletName__cancel"));

		await waitFor(() => expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/));
	});
});
