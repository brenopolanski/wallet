import { PBKDF2 } from "@payvo/sdk-cryptography";
import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import {
	env,
	fireEvent,
	getDefaultProfileId,
	getDefaultWalletMnemonic,
	MNEMONICS,
	renderWithForm,
	screen,
	waitFor,
} from "utils/testing-library";

import { AuthenticationStep } from "./AuthenticationStep";

describe("AuthenticationStep", () => {
	let wallet: Contracts.IReadWriteWallet;
	let profile: Contracts.IProfile;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();
	});

	it("should validate if mnemonic match the wallet address", async () => {
		wallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});

		profile.wallets().push(wallet);

		jest.spyOn(wallet, "isSecondSignature").mockReturnValue(false);

		const { form } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
			target: {
				value: "wrong passphrase",
			},
		});

		await waitFor(() => expect(form()?.formState.isValid).toBe(false));

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
			target: {
				value: MNEMONICS[0],
			},
		});

		await waitFor(() => expect(form()?.formState.isValid).toBeTruthy());

		profile.wallets().forget(wallet.id());
		jest.clearAllMocks();
	});

	it("should validate if second mnemonic matches the wallet second public key", async () => {
		wallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});

		profile.wallets().push(wallet);
		const secondMnemonic = MNEMONICS[1];

		jest.spyOn(wallet, "isSecondSignature").mockReturnValue(true);
		jest.spyOn(wallet, "secondPublicKey").mockReturnValue(
			(await wallet.coin().publicKey().fromMnemonic(secondMnemonic)).publicKey,
		);

		const { form } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
			target: {
				value: MNEMONICS[0],
			},
		});

		fireEvent.input(screen.getByTestId("AuthenticationStep__second-mnemonic"), {
			target: {
				value: "wrong second mnemonic",
			},
		});

		await waitFor(() => expect(form()?.formState.isValid).toBeFalsy());

		fireEvent.input(screen.getByTestId("AuthenticationStep__second-mnemonic"), {
			target: {
				value: secondMnemonic,
			},
		});

		await waitFor(() => expect(form()?.formState.isValid).toBeTruthy());

		profile.wallets().forget(wallet.id());
		jest.clearAllMocks();
	});

	it("should validate if second secret matches the wallet second public key", async () => {
		wallet = await profile.walletFactory().fromSecret({
			coin: "ARK",
			network: "ark.devnet",
			secret: "abc",
		});

		const { form } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		fireEvent.input(screen.getByTestId("AuthenticationStep__secret"), {
			target: {
				value: "abc",
			},
		});

		fireEvent.input(screen.getByTestId("AuthenticationStep__second-secret"), {
			target: {
				value: "wrong second secret",
			},
		});

		await waitFor(() => expect(form()?.formState.isValid).toBeFalsy());

		fireEvent.input(screen.getByTestId("AuthenticationStep__second-secret"), {
			target: {
				value: "abc",
			},
		});

		await waitFor(() => expect(form()?.formState.isValid).toBeTruthy());
	});

	it("should request mnemonic if wallet was imported using mnemonic", async () => {
		wallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[2],
			network: "ark.devnet",
		});

		const isSecondSignatureMock = jest.spyOn(wallet, "isSecondSignature").mockReturnValue(false);

		const { form, asFragment } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeNull());

		expect(screen.queryByTestId("AuthenticationStep__mnemonic")).toBeInTheDocument();

		fireEvent.change(screen.getByTestId("AuthenticationStep__mnemonic"), {
			target: {
				value: MNEMONICS[0],
			},
		});

		await waitFor(() => expect(form()?.getValues()).toEqual({ mnemonic: MNEMONICS[0] }));

		expect(asFragment()).toMatchSnapshot();

		isSecondSignatureMock.mockRestore();
	});

	it("should request secret if wallet was imported using secret", async () => {
		wallet = await profile.walletFactory().fromSecret({
			coin: "ARK",
			network: "ark.devnet",
			secret: "secret",
		});

		const isSecondSignatureMock = jest.spyOn(wallet, "isSecondSignature").mockReturnValue(false);

		const { form, asFragment } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeNull());

		expect(screen.queryByTestId("AuthenticationStep__secret")).toBeInTheDocument();

		fireEvent.change(screen.getByTestId("AuthenticationStep__secret"), {
			target: {
				value: "secret",
			},
		});

		await waitFor(() => expect(form()?.getValues()).toEqual({ secret: "secret" }));

		expect(asFragment()).toMatchSnapshot();

		isSecondSignatureMock.mockRestore();
	});

	it("should request mnemonic if wallet was imported using address", async () => {
		wallet = await profile.walletFactory().fromAddress({
			address: "DJpFwW39QnQvQRQJF2MCfAoKvsX4DJ28jq",
			coin: "ARK",
			network: "ark.devnet",
		});

		const isSecondSignatureMock = jest.spyOn(wallet, "isSecondSignature").mockReturnValue(false);

		const { form, asFragment } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeNull());

		expect(screen.queryByTestId("AuthenticationStep__mnemonic")).toBeInTheDocument();

		fireEvent.change(screen.getByTestId("AuthenticationStep__mnemonic"), {
			target: {
				value: MNEMONICS[0],
			},
		});

		await waitFor(() => expect(form()?.getValues()).toEqual({ mnemonic: MNEMONICS[0] }));

		expect(asFragment()).toMatchSnapshot();

		isSecondSignatureMock.mockRestore();
	});

	it("should request private key if wallet was imported using private key", async () => {
		wallet = await profile.walletFactory().fromPrivateKey({
			coin: "ARK",
			network: "ark.devnet",
			privateKey: "d8839c2432bfd0a67ef10a804ba991eabba19f154a3d707917681d45822a5712",
		});

		jest.spyOn(wallet, "isSecondSignature").mockReturnValueOnce(false);

		const { asFragment } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeNull());

		expect(screen.queryByTestId("AuthenticationStep__private-key")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should request WIF if wallet was imported using WIF", async () => {
		wallet = await profile.walletFactory().fromWIF({
			coin: "ARK",
			network: "ark.devnet",
			wif: "SGq4xLgZKCGxs7bjmwnBrWcT4C1ADFEermj846KC97FSv1WFD1dA",
		});

		jest.spyOn(wallet, "isSecondSignature").mockReturnValueOnce(false);

		const { asFragment } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeNull());

		expect(screen.queryByTestId("AuthenticationStep__wif")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should request mnemonic and second mnemonic", async () => {
		await wallet.synchroniser().identity();
		jest.spyOn(wallet, "isSecondSignature").mockReturnValueOnce(true);

		const { form, asFragment } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		await screen.findByTestId("AuthenticationStep__mnemonic");

		expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeInTheDocument();

		fireEvent.change(screen.getByTestId("AuthenticationStep__mnemonic"), {
			target: {
				value: MNEMONICS[0],
			},
		});

		fireEvent.change(screen.getByTestId("AuthenticationStep__second-mnemonic"), {
			target: {
				value: MNEMONICS[1],
			},
		});

		await waitFor(() =>
			expect(form()?.getValues()).toEqual({
				mnemonic: MNEMONICS[0],
				secondMnemonic: MNEMONICS[1],
			}),
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should request secret and second secret", async () => {
		wallet = await profile.walletFactory().fromSecret({
			coin: "ARK",
			network: "ark.devnet",
			secret: "abc",
		});

		const { form, asFragment } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		await screen.findByTestId("AuthenticationStep__secret");

		expect(screen.queryByTestId("AuthenticationStep__second-secret")).toBeInTheDocument();

		fireEvent.change(screen.getByTestId("AuthenticationStep__secret"), {
			target: {
				value: "abc",
			},
		});

		fireEvent.change(screen.getByTestId("AuthenticationStep__second-secret"), {
			target: {
				value: "abc",
			},
		});

		await waitFor(() =>
			expect(form()?.getValues()).toEqual({
				secondSecret: "abc",
				secret: "abc",
			}),
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should show only ledger confirmation", async () => {
		jest.spyOn(wallet, "isLedger").mockReturnValueOnce(true);

		const { asFragment } = renderWithForm(<AuthenticationStep wallet={wallet} />, {
			withProviders: true,
		});

		await screen.findByTestId("LedgerConfirmation-description");
		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__mnemonic")).toBeNull());
		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeNull());

		expect(asFragment()).toMatchSnapshot();

		jest.clearAllMocks();
	});

	it("should specify ledger supported model", async () => {
		jest.spyOn(wallet, "isLedger").mockReturnValueOnce(true);

		const { asFragment } = renderWithForm(
			<AuthenticationStep
				ledgerIsAwaitingApp={false}
				ledgerIsAwaitingDevice={true}
				ledgerConnectedModel={Contracts.WalletLedgerModel.NanoS}
				ledgerSupportedModels={[Contracts.WalletLedgerModel.NanoX]}
				wallet={wallet}
			/>,
			{
				withProviders: true,
			},
		);

		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__mnemonic")).toBeNull());

		expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeNull();
		expect(asFragment()).toMatchSnapshot();

		jest.clearAllMocks();
	});

	it("should show ledger waiting device screen", () => {
		jest.spyOn(wallet, "isLedger").mockReturnValueOnce(true);

		const { asFragment } = renderWithForm(<AuthenticationStep wallet={wallet} ledgerIsAwaitingDevice={true} />, {
			withProviders: true,
		});

		expect(screen.queryByTestId("LedgerWaitingDevice-loading_message")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show ledger waiting device screen for Nano X", async () => {
		jest.spyOn(wallet, "isLedger").mockReturnValueOnce(true);

		const { asFragment } = renderWithForm(
			<AuthenticationStep
				ledgerIsAwaitingDevice={false}
				ledgerIsAwaitingApp={false}
				ledgerSupportedModels={[Contracts.WalletLedgerModel.NanoX]}
				wallet={wallet}
			/>,
			{
				withProviders: true,
			},
		);

		await screen.findByTestId("LedgerConfirmation-description");

		expect(asFragment()).toMatchSnapshot();

		jest.restoreAllMocks();
	});

	it("should show ledger waiting device screen for Nano S", async () => {
		jest.spyOn(wallet, "isLedger").mockReturnValueOnce(true);

		const { asFragment } = renderWithForm(
			<AuthenticationStep
				ledgerIsAwaitingDevice={false}
				ledgerIsAwaitingApp={false}
				ledgerSupportedModels={[Contracts.WalletLedgerModel.NanoS]}
				wallet={wallet}
			/>,
			{
				withProviders: true,
			},
		);

		await screen.findByTestId("LedgerConfirmation-description");

		expect(asFragment()).toMatchSnapshot();

		jest.restoreAllMocks();
	});

	it("should show ledger waiting app screen", () => {
		jest.spyOn(wallet, "isLedger").mockReturnValueOnce(true);

		const { asFragment } = renderWithForm(
			<AuthenticationStep
				ledgerIsAwaitingDevice={false}
				ledgerIsAwaitingApp={true}
				ledgerSupportedModels={[Contracts.WalletLedgerModel.NanoS]}
				wallet={wallet}
			/>,
			{
				withProviders: true,
			},
		);

		expect(screen.queryByTestId("LedgerWaitingApp-loading_message")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with encryption password input", async () => {
		jest.spyOn(wallet, "actsWithMnemonic").mockReturnValue(false);
		jest.spyOn(wallet, "actsWithWifWithEncryption").mockReturnValue(true);
		jest.spyOn(wallet.signingKey(), "get").mockReturnValue(PBKDF2.encrypt(getDefaultWalletMnemonic(), "password"));

		renderWithForm(<AuthenticationStep wallet={wallet} />, { withProviders: true });

		await screen.findByTestId("AuthenticationStep__encryption-password");

		jest.clearAllMocks();
	});
});
