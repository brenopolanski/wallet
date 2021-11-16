/* eslint-disable @typescript-eslint/require-await */
import { Observer } from "@ledgerhq/hw-transport";
import { BIP39 } from "@payvo/cryptography";
import { Contracts } from "@payvo/profiles";
import { Signatories } from "@payvo/sdk";
import userEvent from "@testing-library/user-event";
import { LedgerProvider, minVersionList } from "app/contexts";
import { translations as transactionTranslations } from "domains/transaction/i18n";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import DelegateRegistrationFixture from "tests/fixtures/coins/ark/devnet/transactions/delegate-registration.json";
import MultisignatureRegistrationFixture from "tests/fixtures/coins/ark/devnet/transactions/multisignature-registration.json";
import SecondSignatureRegistrationFixture from "tests/fixtures/coins/ark/devnet/transactions/second-signature-registration.json";
import {
	act,
	defaultNetMocks,
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	getDefaultWalletMnemonic,
	MNEMONICS,
	render,
	screen,
	syncDelegates,
	syncFees,
	waitFor,
	within,
} from "utils/testing-library";

import { SendRegistration } from ".";

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
let secondWallet: Contracts.IReadWriteWallet;
const history = createMemoryHistory();
const passphrase = getDefaultWalletMnemonic();
const ledgerTransport = getDefaultLedgerTransport();
let getVersionSpy: jest.SpyInstance;

const path = "/profiles/:profileId/wallets/:walletId/send-registration/:registrationType";

const renderPage = async (wallet: Contracts.IReadWriteWallet, type = "delegateRegistration") => {
	const registrationURL = `/profiles/${profile.id()}/wallets/${wallet.id()}/send-registration/${type}`;

	history.push(registrationURL);

	const rendered = render(
		<Route path={path}>
			<LedgerProvider transport={ledgerTransport}>
				<SendRegistration />
			</LedgerProvider>
		</Route>,
		{
			history,
			routes: [registrationURL],
		},
	);

	await rendered.findByTestId("Registration__form");

	return {
		...rendered,
		history,
	};
};

const createDelegateRegistrationMock = (wallet: Contracts.IReadWriteWallet) =>
	// @ts-ignore
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => +DelegateRegistrationFixture.data.amount / 1e8,
		data: () => ({ data: () => DelegateRegistrationFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${DelegateRegistrationFixture.data.id}`,
		fee: () => +DelegateRegistrationFixture.data.fee / 1e8,
		id: () => DelegateRegistrationFixture.data.id,
		isMultiSignatureRegistration: () => false,
		recipient: () => DelegateRegistrationFixture.data.recipient,
		sender: () => DelegateRegistrationFixture.data.sender,
		type: () => "delegateRegistration",
		username: () => DelegateRegistrationFixture.data.asset.delegate.username,
		usesMultiSignature: () => false,
	});

const createSecondSignatureRegistrationMock = (wallet: Contracts.IReadWriteWallet) =>
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => 0,
		data: () => ({ data: () => SecondSignatureRegistrationFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${SecondSignatureRegistrationFixture.data.id}`,
		fee: () => +SecondSignatureRegistrationFixture.data.fee / 1e8,
		id: () => SecondSignatureRegistrationFixture.data.id,
		isMultiSignatureRegistration: () => false,
		recipient: () => SecondSignatureRegistrationFixture.data.recipient,
		sender: () => SecondSignatureRegistrationFixture.data.sender,
		type: () => "secondSignature",
		usesMultiSignature: () => false,
	} as any);

const createMultiSignatureRegistrationMock = (wallet: Contracts.IReadWriteWallet) =>
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => 0,
		data: () => ({ data: () => MultisignatureRegistrationFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${MultisignatureRegistrationFixture.data.id}`,
		fee: () => +MultisignatureRegistrationFixture.data.fee / 1e8,
		get: (attribute: string) => {
			if (attribute === "multiSignature") {
				return {
					min: 2,
					publicKeys: [
						"03df6cd794a7d404db4f1b25816d8976d0e72c5177d17ac9b19a92703b62cdbbbc",
						"034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
					],
				};
			}

			return undefined;
		},
		id: () => MultisignatureRegistrationFixture.data.id,
		isMultiSignatureRegistration: () => true,
		recipient: () => MultisignatureRegistrationFixture.data.recipient,
		sender: () => MultisignatureRegistrationFixture.data.sender,
		type: () => "multiSignature",
		usesMultiSignature: () => false,
	} as any);

describe("Registration", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().findByAddressWithNetwork("D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD", "ark.devnet")!;
		// secondWallet = profile.wallets().findByAddressWithNetwork("D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb", "ark.devnet")!;
		secondWallet = profile.wallets().push(
			await profile.walletFactory().fromAddress({
				address: "DABCrsfEqhtdzmBrE2AU5NNmdUFCGXKEkr",
				coin: "ARK",
				network: "ark.devnet",
			}),
		);

		getVersionSpy = jest
			.spyOn(wallet.coin().ledger(), "getVersion")
			.mockResolvedValue(minVersionList[wallet.network().coin()]);

		await wallet.synchroniser().identity();
		await secondWallet.synchroniser().identity();

		profile.wallets().push(
			await profile.walletFactory().fromAddress({
				address: "D61mfSggzbvQgTUe6JhYKH2doHaqJ3Dyib",
				coin: "ARK",
				network: "ark.devnet",
			}),
		);

		await syncDelegates(profile);
		await syncFees(profile);
	});

	afterAll(() => {
		getVersionSpy.mockRestore();
	});

	beforeEach(() => {
		nock.cleanAll();
		defaultNetMocks();

		nock("https://ark-test-musig.payvo.com/")
			.get("/api/wallets/DDA5nM7KEqLeTtQKv5qGgcnc6dpNBKJNTS")
			.reply(200, require("tests/fixtures/coins/ark/devnet/wallets/D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb.json"));

		nock("https://ark-test-musig.payvo.com")
			.post("/")
			.reply(200, { result: { id: "03df6cd794a7d404db4f1b25816d8976d0e72c5177d17ac9b19a92703b62cdbbbc" } })
			.persist();
	});

	it.each([
		["delegateRegistration", "Register Delegate"],
		["secondSignature", "Register Second Signature"],
		["multiSignature", "Multisignature Registration"],
	])("should handle registrationType param (%s)", async (type, label) => {
		const registrationPath = `/profiles/${getDefaultProfileId()}/wallets/${secondWallet.id()}/send-registration/${type}`;
		history.push(registrationPath);

		render(
			<Route path={path}>
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendRegistration />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [registrationPath],
			},
		);

		await screen.findByTestId("Registration__form");
		await waitFor(() => expect(screen.getByTestId("header__title")).toHaveTextContent(label));
	});

	it.each(["with keyboard", "without keyboard"])("should register delegate %s", async (inputMethod) => {
		const { asFragment, getByTestId, history, findByTestId } = await renderPage(wallet);

		// Step 1
		await findByTestId("DelegateRegistrationForm__form-step");

		fireEvent.change(getByTestId("Input__username"), { target: { value: "test_delegate" } });
		await waitFor(() => expect(getByTestId("Input__username")).toHaveValue("test_delegate"));

		const fees = within(getByTestId("InputFee")).getAllByTestId("ButtonGroupOption");
		userEvent.click(fees[1]);

		userEvent.click(
			within(getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED),
		);

		await waitFor(() => expect(getByTestId("InputCurrency")).not.toHaveValue("0"));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toHaveAttribute("disabled"));

		if (inputMethod === "with keyboard") {
			userEvent.keyboard("{enter}");
		} else {
			userEvent.click(getByTestId("StepNavigation__continue-button"));
		}
		await findByTestId("DelegateRegistrationForm__review-step");

		userEvent.click(getByTestId("StepNavigation__back-button"));
		await findByTestId("DelegateRegistrationForm__form-step");

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toHaveAttribute("disabled"));
		if (inputMethod === "with keyboard") {
			userEvent.keyboard("{enter}");
		} else {
			userEvent.click(getByTestId("StepNavigation__continue-button"));
		}

		if (inputMethod === "with keyboard") {
			userEvent.keyboard("{enter}");
		} else {
			userEvent.click(getByTestId("StepNavigation__continue-button"));
		}
		await findByTestId("AuthenticationStep");

		const passwordInput = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(passwordInput, { target: { value: passphrase } });
		await waitFor(() => expect(passwordInput).toHaveValue(passphrase));

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toHaveAttribute("disabled"));

		const signMock = jest
			.spyOn(wallet.transaction(), "signDelegateRegistration")
			.mockReturnValue(Promise.resolve(DelegateRegistrationFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [DelegateRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createDelegateRegistrationMock(wallet);

		if (inputMethod === "with keyboard") {
			fireEvent.submit(getByTestId("AuthenticationStep"));
		} else {
			userEvent.click(getByTestId("StepNavigation__send-button"));
		}

		await waitFor(() => {
			expect(signMock).toHaveBeenCalledWith({
				data: { username: "test_delegate" },
				fee: 25,
				signatory: expect.any(Signatories.Signatory),
			});
		});

		await waitFor(() => expect(broadcastMock).toHaveBeenCalledWith(DelegateRegistrationFixture.data.id));
		await waitFor(() => expect(transactionMock).toHaveBeenCalledWith(DelegateRegistrationFixture.data.id));

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();

		// Step 4 - summary screen
		await findByTestId("TransactionSuccessful");

		// Go back to wallet
		const historySpy = jest.spyOn(history, "push");
		userEvent.click(getByTestId("StepNavigation__back-to-wallet-button"));

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		historySpy.mockRestore();
		await waitFor(() => expect(asFragment()).toMatchSnapshot());
	});

	it("should register second signature", async () => {
		const bip39GenerateMock = jest.spyOn(BIP39, "generate").mockReturnValue(passphrase);

		const { asFragment } = await renderPage(wallet, "secondSignature");

		await screen.findByTestId("SecondSignatureRegistrationForm__generation-step");

		const fees = within(screen.getByTestId("InputFee")).getAllByTestId("ButtonGroupOption");
		userEvent.click(fees[1]);

		userEvent.click(
			within(screen.getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED),
		);

		await waitFor(() => expect(screen.getByTestId("InputCurrency")).not.toHaveValue("0"));

		userEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SecondSignatureRegistrationForm__backup-step");

		userEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SecondSignatureRegistrationForm__verification-step");

		const words = passphrase.split(" ");

		for (let index = 0; index < 3; index++) {
			const wordNumber = Number.parseInt(screen.getByText(/Select the/).innerHTML.replace(/Select the/, ""));

			userEvent.click(screen.getByText(words[wordNumber - 1]));

			if (index < 2) {
				await waitFor(() => expect(screen.queryAllByText(/The (\d+)/).length === 2 - index));
			}
		}

		await waitFor(() => expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		userEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SecondSignatureRegistrationForm__review-step");

		userEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("AuthenticationStep");

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		await waitFor(() => expect(screen.getByTestId("StepNavigation__send-button")).not.toHaveAttribute("disabled"));

		expect(asFragment()).toMatchSnapshot();

		const signMock = jest
			.spyOn(wallet.transaction(), "signSecondSignature")
			.mockReturnValue(Promise.resolve(SecondSignatureRegistrationFixture.data.id));

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [SecondSignatureRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});

		const transactionMock = createSecondSignatureRegistrationMock(wallet);

		userEvent.click(screen.getByTestId("StepNavigation__send-button"));

		await waitFor(() =>
			expect(signMock).toHaveBeenCalledWith({
				data: { mnemonic: passphrase },
				fee: 0.1,
				signatory: expect.any(Signatories.Signatory),
			}),
		);

		await waitFor(() => expect(broadcastMock).toHaveBeenCalledWith(SecondSignatureRegistrationFixture.data.id));
		await waitFor(() => expect(transactionMock).toHaveBeenCalledWith(SecondSignatureRegistrationFixture.data.id));

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();

		bip39GenerateMock.mockRestore();
	});

	it("should send multisignature registration", async () => {
		const { getByTestId, getAllByTestId, findByTestId } = await renderPage(wallet, "multiSignature");

		const signTransactionMock = jest
			.spyOn(wallet.transaction(), "signMultiSignature")
			.mockReturnValue(Promise.resolve(MultisignatureRegistrationFixture.data.id));

		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue({
			accepted: [MultisignatureRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});

		const multiSignatureRegistrationMock = createMultiSignatureRegistrationMock(wallet);

		const wallet2 = profile.wallets().last();

		await findByTestId("Registration__form");
		await waitFor(() => expect(getByTestId("header__title")).toHaveTextContent("Multisignature Registration"));

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: wallet2.address(),
			},
		});

		userEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => expect(getAllByTestId("recipient-list__recipient-list-item")).toHaveLength(2));
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toHaveAttribute("disabled"));

		// Step 2
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toHaveAttribute("disabled"));
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review step
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		// Authentication step
		await findByTestId("AuthenticationStep");
		const mnemonic = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(mnemonic, { target: { value: passphrase } });
		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		userEvent.click(getByTestId("StepNavigation__send-button"));

		await findByTestId("TransactionSuccessful");

		signTransactionMock.mockRestore();
		multiSignatureRegistrationMock.mockRestore();
		addSignatureMock.mockRestore();
	});

	it("should send multisignature registration with ledger wallet", async () => {
		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const listenSpy = jest.spyOn(ledgerTransport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

		const { getByTestId, getAllByTestId, findByTestId } = await renderPage(wallet, "multiSignature");

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoX" }, type: "add" });
		});

		// Ledger mocks
		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockImplementation(() => true);
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();

		const getPublicKeyMock = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue("0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb");

		const signTransactionMock = jest
			.spyOn(wallet.transaction(), "signMultiSignature")
			.mockReturnValue(Promise.resolve(MultisignatureRegistrationFixture.data.id));

		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue({
			accepted: [MultisignatureRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});

		const multiSignatureRegistrationMock = createMultiSignatureRegistrationMock(wallet);

		const wallet2 = profile.wallets().last();

		await findByTestId("Registration__form");
		await waitFor(() => expect(getByTestId("header__title")).toHaveTextContent("Multisignature Registration"));

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: wallet2.address(),
			},
		});

		userEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => expect(getAllByTestId("recipient-list__recipient-list-item")).toHaveLength(2));
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toHaveAttribute("disabled"));

		// Step 2
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		const mockDerivationPath = jest.spyOn(wallet.data(), "get").mockReturnValue("m/44'/1'/1'/0/0");
		// Skip Authentication Step
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		await waitFor(() => expect(getByTestId("header__title")).toHaveTextContent("Ledger Wallet"));
		await findByTestId("TransactionSuccessful");

		isLedgerMock.mockRestore();
		getPublicKeyMock.mockRestore();
		signTransactionMock.mockRestore();
		multiSignatureRegistrationMock.mockRestore();
		addSignatureMock.mockRestore();
		mockDerivationPath.mockRestore();
		listenSpy.mockRestore();
	});

	it("should show ledger error screen in authentication if nanoS is connected", async () => {
		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const listenSpy = jest.spyOn(ledgerTransport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

		const { getByTestId, getAllByTestId, findByTestId } = await renderPage(wallet, "multiSignature");

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoS" }, type: "add" });
		});

		// Ledger mocks
		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockImplementation(() => true);
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();

		const getPublicKeyMock = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue("0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb");

		const signTransactionMock = jest
			.spyOn(wallet.transaction(), "signMultiSignature")
			.mockReturnValue(Promise.resolve(MultisignatureRegistrationFixture.data.id));

		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue({
			accepted: [MultisignatureRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});

		const multiSignatureRegistrationMock = createMultiSignatureRegistrationMock(wallet);

		const wallet2 = profile.wallets().last();

		await findByTestId("Registration__form");
		await waitFor(() => expect(getByTestId("header__title")).toHaveTextContent("Multisignature Registration"));

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: wallet2.address(),
			},
		});

		userEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => expect(getAllByTestId("recipient-list__recipient-list-item")).toHaveLength(2));
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toHaveAttribute("disabled"));

		// Step 2
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		const mockDerivationPath = jest.spyOn(wallet.data(), "get").mockReturnValue("m/44'/1'/1'/0/0");
		// Skip Authentication Step
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		await findByTestId("LedgerDeviceError");

		isLedgerMock.mockRestore();
		getPublicKeyMock.mockRestore();
		signTransactionMock.mockRestore();
		multiSignatureRegistrationMock.mockRestore();
		addSignatureMock.mockRestore();
		mockDerivationPath.mockRestore();
		listenSpy.mockRestore();
	});

	it("should should reset authentication when a supported Nano X is added", async () => {
		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const listenSpy = jest.spyOn(ledgerTransport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

		const { getByTestId, getAllByTestId, findByTestId } = await renderPage(wallet, "multiSignature");

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoS" }, type: "add" });
		});

		// Ledger mocks
		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockImplementation(() => true);
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();

		const getPublicKeyMock = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue("0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb");

		const signTransactionMock = jest
			.spyOn(wallet.transaction(), "signMultiSignature")
			.mockReturnValue(Promise.resolve(MultisignatureRegistrationFixture.data.id));

		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue({
			accepted: [MultisignatureRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});

		const multiSignatureRegistrationMock = createMultiSignatureRegistrationMock(wallet);

		const wallet2 = profile.wallets().last();

		await findByTestId("Registration__form");
		await waitFor(() => expect(getByTestId("header__title")).toHaveTextContent("Multisignature Registration"));

		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: {
				value: wallet2.address(),
			},
		});

		userEvent.click(screen.getByText(transactionTranslations.MULTISIGNATURE.ADD_PARTICIPANT));

		await waitFor(() => expect(getAllByTestId("recipient-list__recipient-list-item")).toHaveLength(2));
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toHaveAttribute("disabled"));

		// Step 2
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		const mockDerivationPath = jest.spyOn(wallet.data(), "get").mockReturnValue("m/44'/1'/1'/0/0");
		// Skip Authentication Step
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		await findByTestId("LedgerDeviceError");

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoX" }, type: "add" });
		});

		await waitFor(() => expect(getByTestId("header__title")).toHaveTextContent("Ledger Wallet"));
		await findByTestId("TransactionSuccessful");

		isLedgerMock.mockRestore();
		getPublicKeyMock.mockRestore();
		signTransactionMock.mockRestore();
		multiSignatureRegistrationMock.mockRestore();
		addSignatureMock.mockRestore();
		mockDerivationPath.mockRestore();
		listenSpy.mockRestore();
	});

	it("should set fee", async () => {
		const { getByTestId, findByTestId } = await renderPage(wallet);

		await findByTestId("DelegateRegistrationForm__form-step");

		userEvent.click(
			within(getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED),
		);
		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("25"));

		userEvent.click(within(getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.SIMPLE));

		expect(() => getByTestId("InputCurrency")).toThrow(/Unable to find an element by/);
	});

	it("should return to form step by cancelling fee warning", async () => {
		const { getByTestId, findByTestId } = await renderPage(wallet);

		await findByTestId("DelegateRegistrationForm__form-step");

		fireEvent.change(getByTestId("Input__username"), { target: { value: "test_delegate" } });

		expect(getByTestId("Input__username")).toHaveValue("test_delegate");

		// Fee
		userEvent.click(
			within(getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED),
		);
		fireEvent.change(getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("10"));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("DelegateRegistrationForm__review-step")).toBeInTheDocument();

		userEvent.click(getByTestId("StepNavigation__continue-button"));

		// Fee warning
		expect(getByTestId("FeeWarning__cancel-button")).toBeInTheDocument();

		userEvent.click(getByTestId("FeeWarning__cancel-button"));

		await findByTestId("DelegateRegistrationForm__form-step");
	});

	it("should proceed to authentication step by confirming fee warning", async () => {
		const { getByTestId, findByTestId } = await renderPage(wallet);

		await findByTestId("DelegateRegistrationForm__form-step");

		fireEvent.change(getByTestId("Input__username"), { target: { value: "test_delegate" } });

		expect(getByTestId("Input__username")).toHaveValue("test_delegate");

		// Fee
		userEvent.click(
			within(getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED),
		);
		fireEvent.change(getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("10"));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		userEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("DelegateRegistrationForm__review-step")).toBeInTheDocument();

		userEvent.click(getByTestId("StepNavigation__continue-button"));

		// Fee warning
		expect(getByTestId("FeeWarning__continue-button")).toBeInTheDocument();

		userEvent.click(getByTestId("FeeWarning__continue-button"));

		await findByTestId("AuthenticationStep");
	});

	it("should show mnemonic error", async () => {
		const { container, getByTestId, findByTestId } = await renderPage(secondWallet);

		const actsWithMnemonicMock = jest.spyOn(secondWallet, "actsWithMnemonic").mockReturnValue(true);

		const secondPublicKeyMock = jest
			.spyOn(secondWallet, "secondPublicKey")
			.mockReturnValue((await secondWallet.coin().publicKey().fromMnemonic(MNEMONICS[1])).publicKey);

		await findByTestId("DelegateRegistrationForm__form-step");

		fireEvent.change(getByTestId("Input__username"), {
			target: {
				value: "username",
			},
		});
		await waitFor(() => expect(getByTestId("Input__username")).toHaveValue("username"));

		userEvent.click(getByTestId("StepNavigation__continue-button"));
		await findByTestId("DelegateRegistrationForm__review-step");

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		userEvent.click(getByTestId("StepNavigation__continue-button"));
		await findByTestId("AuthenticationStep");

		const mnemonic = getByTestId("AuthenticationStep__mnemonic");
		const secondMnemonic = getByTestId("AuthenticationStep__second-mnemonic");

		fireEvent.input(mnemonic, { target: { value: MNEMONICS[0] } });
		await waitFor(() => expect(mnemonic).toHaveValue(MNEMONICS[0]));

		fireEvent.input(secondMnemonic, { target: { value: MNEMONICS[2] } });
		await waitFor(() => expect(secondMnemonic).toHaveValue(MNEMONICS[2]));

		expect(getByTestId("StepNavigation__send-button")).toBeDisabled();

		await waitFor(() => expect(getByTestId("Input__error")).toBeVisible());

		expect(getByTestId("Input__error")).toHaveAttribute(
			"data-errortext",
			"This mnemonic does not correspond to your wallet",
		);
		expect(container).toMatchSnapshot();

		actsWithMnemonicMock.mockRestore();
		secondPublicKeyMock.mockRestore();
	});

	it("should prevent going to the next step with enter on the success step", async () => {
		await renderPage(wallet);

		await screen.findByTestId("DelegateRegistrationForm__form-step");

		fireEvent.change(screen.getByTestId("Input__username"), {
			target: {
				value: "username",
			},
		});
		await waitFor(() => expect(screen.getByTestId("Input__username")).toHaveValue("username"));

		userEvent.keyboard("{enter}");
		await screen.findByTestId("DelegateRegistrationForm__review-step");

		await waitFor(() => expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		userEvent.keyboard("{enter}");
		await screen.findByTestId("AuthenticationStep");

		const mnemonic = screen.getByTestId("AuthenticationStep__mnemonic");

		fireEvent.input(mnemonic, { target: { value: passphrase } });
		await waitFor(() => expect(mnemonic).toHaveValue(passphrase));

		userEvent.keyboard("{enter}");

		await screen.findByTestId("AuthenticationStep");

		const signMock = jest
			.spyOn(wallet.transaction(), "signDelegateRegistration")
			.mockReturnValue(Promise.resolve(DelegateRegistrationFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [DelegateRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createDelegateRegistrationMock(wallet);

		fireEvent.submit(screen.getByTestId("AuthenticationStep"));

		await waitFor(() =>
			expect(signMock).toHaveBeenCalledWith({
				data: { username: "username" },
				fee: 25,
				signatory: expect.any(Signatories.Signatory),
			}),
		);

		await waitFor(() => expect(broadcastMock).toHaveBeenCalledWith(DelegateRegistrationFixture.data.id));
		await waitFor(() => expect(transactionMock).toHaveBeenCalledWith(DelegateRegistrationFixture.data.id));

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();

		// Step 4 - success screen
		await screen.findByTestId("TransactionSuccessful");

		userEvent.keyboard("{enter}");

		await screen.findByTestId("TransactionSuccessful");
	});

	it("should go back to wallet details", async () => {
		const { getByTestId, findByTestId } = await renderPage(wallet);

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		await findByTestId("DelegateRegistrationForm__form-step");

		userEvent.click(getByTestId("StepNavigation__back-button"));

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		historySpy.mockRestore();
	});

	it("should show error step and go back", async () => {
		const { asFragment, getByTestId, findByTestId } = await renderPage(secondWallet);

		const actsWithMnemonicMock = jest.spyOn(secondWallet, "actsWithMnemonic").mockReturnValue(true);

		const secondPublicKeyMock = jest
			.spyOn(secondWallet, "secondPublicKey")
			.mockReturnValue((await secondWallet.coin().publicKey().fromMnemonic(MNEMONICS[1])).publicKey);

		await findByTestId("DelegateRegistrationForm__form-step");

		fireEvent.change(getByTestId("Input__username"), {
			target: {
				value: "delegate",
			},
		});
		await waitFor(() => expect(getByTestId("Input__username")).toHaveValue("delegate"));

		userEvent.click(getByTestId("StepNavigation__continue-button"));
		await findByTestId("DelegateRegistrationForm__review-step");

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		userEvent.click(getByTestId("StepNavigation__continue-button"));
		await findByTestId("AuthenticationStep");

		const mnemonic = getByTestId("AuthenticationStep__mnemonic");
		const secondMnemonic = getByTestId("AuthenticationStep__second-mnemonic");

		fireEvent.input(mnemonic, { target: { value: MNEMONICS[0] } });
		await waitFor(() => expect(mnemonic).toHaveValue(MNEMONICS[0]));

		fireEvent.input(secondMnemonic, { target: { value: MNEMONICS[1] } });
		await waitFor(() => expect(secondMnemonic).toHaveValue(MNEMONICS[1]));

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		const broadcastMock = jest.spyOn(secondWallet.transaction(), "broadcast").mockImplementation(() => {
			throw new Error("broadcast error");
		});

		const historyMock = jest.spyOn(history, "push").mockReturnValue();

		userEvent.click(getByTestId("StepNavigation__send-button"));

		await findByTestId("ErrorStep");

		expect(getByTestId("ErrorStep__errorMessage")).toHaveTextContent("broadcast error");
		expect(asFragment()).toMatchSnapshot();

		userEvent.click(getByTestId("ErrorStep__wallet-button"));

		const walletDetailPage = `/profiles/${getDefaultProfileId()}/wallets/${secondWallet.id()}`;
		await waitFor(() => expect(historyMock).toHaveBeenCalledWith(walletDetailPage));

		historyMock.mockRestore();
		broadcastMock.mockRestore();
		actsWithMnemonicMock.mockRestore();
		secondPublicKeyMock.mockRestore();
	});
});
