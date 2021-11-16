/* eslint-disable @typescript-eslint/require-await */
import { BIP39 } from "@payvo/cryptography";
import { Contracts } from "@payvo/profiles";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, fireEvent, getDefaultProfileId, MNEMONICS, render, screen, waitFor } from "utils/testing-library";

import { CreateWallet } from "./CreateWallet";

let profile: Contracts.IProfile;
let bip39GenerateMock: any;

const passphrase = "power return attend drink piece found tragic fire liar page disease combine";
const fixtureProfileId = getDefaultProfileId();

describe("EncryptionPasswordStep", () => {
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

	it("should fail creating a wallet with encryption password", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		render(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");
		const continueButton = screen.getByTestId("CreateWallet__continue-button");
		const backButton = screen.getByTestId("CreateWallet__back-button");

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		expect(backButton).toBeEnabled();

		userEvent.click(backButton);

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/dashboard`);

		fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });
		await waitFor(() => expect(continueButton).toBeEnabled());

		fireEvent.change(selectNetworkInput, { target: { value: "" } });
		await waitFor(() => expect(continueButton).toBeDisabled());

		fireEvent.change(selectNetworkInput, { target: { value: "Ark Dev" } });
		fireEvent.keyDown(selectNetworkInput, { code: 13, key: "Enter" });

		await waitFor(() => expect(continueButton).toBeEnabled());

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

		userEvent.click(screen.getByTestId("CreateWallet__encryption-toggle"));

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

		//@ts-ignore
		const walletSpy = jest.spyOn(profile, "walletFactory").mockImplementation(() => ({
			fromMnemonicWithBIP39: () => Promise.reject(new Error("failed")),
		}));

		await screen.findByTestId("EncryptPassword");

		const passwordInput = screen.getAllByTestId("InputPassword")[0];
		const confirmPassword = screen.getAllByTestId("InputPassword")[1];

		fireEvent.input(passwordInput, { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(passwordInput).toHaveValue("S3cUrePa$sword"));

		fireEvent.input(confirmPassword, { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(confirmPassword).toHaveValue("S3cUrePa$sword"));

		userEvent.click(screen.getByTestId("CreateWallet__continue-encryption-button"));

		await screen.findByTestId("CreateWallet__SuccessStep");

		userEvent.click(screen.getByTestId("CreateWallet__finish-button"));

		await waitFor(() => expect(walletSpy).toHaveBeenCalledWith());
		walletSpy.mockRestore();
	});

	it("should create a wallet and use encryption password", async () => {
		const history = createMemoryHistory();
		const createURL = `/profiles/${fixtureProfileId}/wallets/create`;
		history.push(createURL);

		render(
			<Route path="/profiles/:profileId/wallets/create">
				<CreateWallet />
			</Route>,
			{
				history,
				routes: [createURL],
			},
		);

		await screen.findByTestId("NetworkStep");

		const selectNetworkInput = screen.getByTestId("SelectNetworkInput__input");
		const continueButton = screen.getByTestId("CreateWallet__continue-button");
		const backButton = screen.getByTestId("CreateWallet__back-button");

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		expect(backButton).toBeEnabled();

		userEvent.click(backButton);

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/dashboard`);

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

		userEvent.click(backButton);

		await screen.findByTestId("NetworkStep");

		userEvent.click(continueButton);

		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		userEvent.click(continueButton);

		await screen.findByTestId("CreateWallet__ConfirmPassphraseStep");

		userEvent.click(backButton);

		await screen.findByTestId("CreateWallet__WalletOverviewStep");

		userEvent.click(screen.getByTestId("CreateWallet__encryption-toggle"));

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

		const sampleWallet = profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});

		//@ts-ignore
		const walletSpy = jest.spyOn(profile, "walletFactory").mockImplementation(() => ({
			fromMnemonicWithBIP39: () => Promise.resolve(sampleWallet),
		}));

		await screen.findByTestId("EncryptPassword");

		const passwordInput = screen.getAllByTestId("InputPassword")[0];
		const confirmPassword = screen.getAllByTestId("InputPassword")[1];

		fireEvent.input(passwordInput, { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(passwordInput).toHaveValue("S3cUrePa$sword"));

		fireEvent.input(confirmPassword, { target: { value: "S3cUrePa$sword" } });

		await waitFor(() => expect(confirmPassword).toHaveValue("S3cUrePa$sword"));

		expect(profile.wallets().values()).toHaveLength(0);

		userEvent.click(screen.getByTestId("CreateWallet__continue-encryption-button"));

		await screen.findByTestId("CreateWallet__SuccessStep");

		expect(profile.wallets().values()).toHaveLength(1);
		expect(walletSpy).toHaveBeenCalledWith();

		userEvent.click(screen.getByTestId("CreateWallet__finish-button"));

		const walletId = profile.wallets().first().id();

		await waitFor(() =>
			expect(historySpy).toHaveBeenCalledWith(`/profiles/${fixtureProfileId}/wallets/${walletId}`),
		);

		historySpy.mockRestore();
	});
});
