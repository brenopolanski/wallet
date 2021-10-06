/* eslint-disable @typescript-eslint/require-await */
import Transport, { Observer } from "@ledgerhq/hw-transport";
import { createTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { Contracts } from "@payvo/profiles";
import { LedgerProvider } from "app/contexts/Ledger/Ledger";
import { toasts } from "app/services";
import { translations as transactionTranslations } from "domains/transaction/i18n";
import { translations as walletTranslations } from "domains/wallet/i18n";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import {
	act,
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	render,
	renderWithRouter,
	screen,
	waitFor,
} from "utils/testing-library";

import { SignedStep } from "./SignedStep";
import { SignMessage } from "./SignMessage";

const history = createMemoryHistory();
let walletUrl: string;

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
let secondWallet: Contracts.IReadWriteWallet;

const mnemonic = MNEMONICS[0];

let transport: typeof Transport;

describe("SignMessage", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		wallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic,
			network: "ark.devnet",
		});
		profile.wallets().push(wallet);

		secondWallet = await profile.walletFactory().fromAddress({
			address: "DCX2kvwgL2mrd9GjyYAbfXLGGXWwgN3Px7",
			coin: "ARK",
			network: "ark.devnet",
		});
		profile.wallets().push(secondWallet);

		walletUrl = `/profiles/${profile.id()}/wallets/${wallet.id()}`;
		history.push(walletUrl);
	});

	beforeEach(() => {
		jest.useFakeTimers();

		transport = createTransportReplayer(RecordStore.fromString(""));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("should render", async () => {
		await wallet.synchroniser().identity();
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} walletId={wallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);

		expect(screen.getByTestId("SignMessage__mnemonic-input")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render for ledger wallets", async () => {
		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockReturnValue(true);

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} walletId={wallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);

		expect(asFragment()).toMatchSnapshot();

		isLedgerMock.mockRestore();
	});

	it("should render with mnemonic field for a wallet that import with address", async () => {
		const secondWalletUrl = `/profiles/${profile.id()}/wallets/${secondWallet.id()}`;
		history.push(secondWalletUrl);

		await secondWallet.synchroniser().identity();
		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} walletId={secondWallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [secondWalletUrl],
			},
		);

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);

		expect(screen.getByTestId("SignMessage__mnemonic-input")).toBeInTheDocument();
	});

	it("should render signed step with wallet alias", () => {
		const aliasMock = jest.spyOn(wallet, "alias").mockReturnValue("my-alias");
		const signedMessage = {
			message: "Hello World",
			signatory: "03d7001f0cfff639c0e458356581c919d5885868f14f72ba3be74c8f105cce34ac",
			signature:
				"e16e8badc6475e2eb4eb814fa0ae434e9ca2240b6131f3bf560969989366baa270786fb87ae2fe2945d60408cedc0a757768ebc768b03bf78e5e9b7a20291ac6",
		};

		const { container } = render(<SignedStep wallet={wallet} signedMessage={signedMessage} />);

		expect(screen.getByText("my-alias")).toBeInTheDocument();
		expect(container).toMatchSnapshot();

		aliasMock.mockRestore();
	});

	it("should sign message", async () => {
		const signedMessage = {
			message: "Hello World",
			signatory: "03d7001f0cfff639c0e458356581c919d5885868f14f72ba3be74c8f105cce34ac",
			signature:
				"e16e8badc6475e2eb4eb814fa0ae434e9ca2240b6131f3bf560969989366baa270786fb87ae2fe2945d60408cedc0a757768ebc768b03bf78e5e9b7a20291ac6",
		};

		const onSign = jest.fn();

		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} onSign={onSign} walletId={wallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);

		const messageInput = screen.getByTestId("SignMessage__message-input");

		act(() => {
			fireEvent.input(messageInput, { target: { value: "Hello World" } });
		});

		const mnemonicInput = screen.getByTestId("SignMessage__mnemonic-input");

		act(() => {
			fireEvent.input(mnemonicInput, { target: { value: mnemonic } });
		});

		await waitFor(() => expect(screen.getByTestId("SignMessage__submit-button")).toBeEnabled());

		act(() => {
			fireEvent.click(screen.getByTestId("SignMessage__submit-button"));
		});

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.SIGNED_STEP.TITLE)).toBeTruthy(),
		);

		const writeTextMock = jest.fn();
		const clipboardOriginal = navigator.clipboard;

		// @ts-ignore
		navigator.clipboard = { writeText: writeTextMock };

		act(() => {
			fireEvent.click(screen.getByTestId("SignMessage__copy-button"));
		});

		await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith(JSON.stringify(signedMessage)));

		expect(onSign).toHaveBeenCalledWith(signedMessage);

		// @ts-ignore
		navigator.clipboard = clipboardOriginal;
	});

	it("should return to form step", async () => {
		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} walletId={wallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);

		const messageInput = screen.getByTestId("SignMessage__message-input");

		act(() => {
			fireEvent.input(messageInput, { target: { value: "Hello World" } });
		});

		const mnemonicInput = screen.getByTestId("SignMessage__mnemonic-input");

		act(() => {
			fireEvent.input(mnemonicInput, { target: { value: mnemonic } });
		});

		await waitFor(() => expect(screen.getByTestId("SignMessage__submit-button")).toBeEnabled());

		act(() => {
			fireEvent.click(screen.getByTestId("SignMessage__submit-button"));
		});

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.SIGNED_STEP.TITLE)).toBeTruthy(),
		);

		act(() => {
			fireEvent.click(screen.getByTestId("SignMessage__back-button"));
		});

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);
	});

	it("should sign message with encryption password", async () => {
		const signedMessage = {
			message: "Hello World",
			signatory: "03d7001f0cfff639c0e458356581c919d5885868f14f72ba3be74c8f105cce34ac",
			signature:
				"e16e8badc6475e2eb4eb814fa0ae434e9ca2240b6131f3bf560969989366baa270786fb87ae2fe2945d60408cedc0a757768ebc768b03bf78e5e9b7a20291ac6",
		};

		const walletUsesWIFMock = jest.spyOn(wallet.signingKey(), "exists").mockReturnValue(true);
		const walletWifMock = jest.spyOn(wallet.signingKey(), "get").mockReturnValue(mnemonic);

		const onSign = jest.fn();

		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} onSign={onSign} walletId={wallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);

		const messageInput = screen.getByTestId("SignMessage__message-input");

		act(() => {
			fireEvent.input(messageInput, { target: { value: "Hello World" } });
		});

		const passwordInput = screen.getByTestId("SignMessage__encryption-password");

		act(() => {
			fireEvent.input(passwordInput, { target: { value: "password" } });
		});

		await waitFor(() => expect(screen.getByTestId("SignMessage__submit-button")).toBeEnabled());

		act(() => {
			fireEvent.click(screen.getByTestId("SignMessage__submit-button"));
		});

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.SIGNED_STEP.TITLE)).toBeTruthy(),
		);

		expect(onSign).toHaveBeenCalledWith(signedMessage);

		walletUsesWIFMock.mockRestore();
		walletWifMock.mockRestore();
	});

	it("should sign message with secret", async () => {
		const signedMessage = {
			message: "Hello World",
			signatory: "03a02b9d5fdd1307c2ee4652ba54d492d1fd11a7d1bb3f3a44c4a05e79f19de933",
			signature:
				"dd373d859dc8d982de49532d55a654058cc18a79116677a09debf7a2b59b35ef27cf44c935a7b8685c359964b4a88dc602d20e52f7fae83f7482b221ba00179a",
		};

		const walletHasSigningKey = jest.spyOn(wallet.signingKey(), "exists").mockReturnValue(false);
		const walletActsWithSecret = jest.spyOn(wallet, "actsWithSecret").mockReturnValue(true);
		const walletActsWithMnemonic = jest.spyOn(wallet, "actsWithMnemonic").mockReturnValue(false);
		const fromSecret = jest.spyOn(wallet.coin().address(), "fromSecret").mockResolvedValue({
			address: wallet.address(),
			type: "bip39",
		});

		const onSign = jest.fn();

		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} onSign={onSign} walletId={wallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);

		const messageInput = screen.getByTestId("SignMessage__message-input");

		act(() => {
			fireEvent.input(messageInput, { target: { value: "Hello World" } });
		});

		const secretInput = screen.getByTestId("SignMessage__secret-input");

		act(() => {
			fireEvent.input(secretInput, { target: { value: "secret" } });
		});

		await waitFor(() => expect(screen.getByTestId("SignMessage__submit-button")).toBeEnabled());

		act(() => {
			fireEvent.click(screen.getByTestId("SignMessage__submit-button"));
		});

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.SIGNED_STEP.TITLE)).toBeTruthy(),
		);

		expect(onSign).toHaveBeenCalledWith(signedMessage);

		walletHasSigningKey.mockRestore();
		walletActsWithSecret.mockRestore();
		walletActsWithMnemonic.mockRestore();
		fromSecret.mockRestore();
	});

	it("should sign message with ledger wallet", async () => {
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();
		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockReturnValue(true);

		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

		const signMessageSpy = jest
			.spyOn(wallet.coin().ledger(), "signMessage")
			.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve("signature"), 300)));

		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} walletId={wallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);

		const messageInput = screen.getByTestId("SignMessage__message-input");

		act(() => {
			fireEvent.input(messageInput, { target: { value: "Hello World" } });
		});

		await waitFor(() => expect(screen.getByTestId("SignMessage__submit-button")).toBeEnabled());

		act(() => {
			fireEvent.click(screen.getByTestId("SignMessage__submit-button"));
		});

		await waitFor(() => expect(screen.getByTestId("LedgerWaitingDevice-loading_message")).toBeTruthy());

		act(() => {
			observer!.next({ descriptor: "", type: "add" });
		});

		await waitFor(() => expect(screen.getByTestId("LedgerWaitingApp-loading_message")).toBeTruthy());

		const getPublicKeySpy = jest.spyOn(wallet.coin(), "ledger").mockImplementation(() => ({
			getPublicKey: () => Promise.resolve(wallet.publicKey()),
		}));

		await waitFor(() => expect(getPublicKeySpy).toHaveBeenCalled());

		signMessageSpy.mockRestore();
		isLedgerMock.mockRestore();
		listenSpy.mockRestore();
		getPublicKeySpy.mockRestore();
	});

	it("should display error toast if user rejects", async () => {
		const toastSpy = jest.spyOn(toasts, "error");

		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockReturnValue(true);

		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

		const consoleErrorMock = jest.spyOn(console, "error").mockImplementation(() => undefined);
		const signMessageSpy = jest
			.spyOn(wallet.coin().ledger(), "signMessage")
			.mockImplementation(
				() =>
					new Promise((_, reject) =>
						setTimeout(() => reject(new Error("Condition of use not satisfied")), 300),
					),
			);

		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} walletId={wallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		await waitFor(
			() => expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
			{
				timeout: 4000,
			},
		);

		const messageInput = screen.getByTestId("SignMessage__message-input");

		act(() => {
			fireEvent.input(messageInput, { target: { value: "Hello World" } });
		});

		await waitFor(() => expect(screen.getByTestId("SignMessage__submit-button")).toBeEnabled());

		act(() => {
			fireEvent.click(screen.getByTestId("SignMessage__submit-button"));
		});

		await waitFor(() => expect(screen.getByTestId("LedgerWaitingDevice-loading_message")).toBeTruthy());

		act(() => {
			observer!.next({ descriptor: "", type: "add" });
		});

		await waitFor(() => expect(screen.getByTestId("LedgerWaitingApp-loading_message")).toBeTruthy());

		const getPublicKeySpy = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue(wallet.publicKey()!);

		await waitFor(() =>
			expect(toastSpy).toHaveBeenCalledWith(transactionTranslations.LEDGER_CONFIRMATION.REJECTED),
		);

		toastSpy.mockRestore();
		signMessageSpy.mockRestore();
		isLedgerMock.mockRestore();
		listenSpy.mockRestore();
		getPublicKeySpy.mockRestore();
		consoleErrorMock.mockRestore();
	});

	it("should display error toast if ledger is not found in time", async () => {
		const toastSpy = jest.spyOn(toasts, "error");

		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockReturnValue(true);

		const unsubscribe = jest.fn();

		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce(() => ({ unsubscribe }));

		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage profile={profile} walletId={wallet.id()} isOpen={true} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		const transportSpy = jest
			.spyOn(transport, "open")
			.mockImplementation(
				() => new Promise((_, reject) => setTimeout(() => reject(new Error("no device found")), 300)),
			);

		await waitFor(() =>
			expect(screen.getByText(walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE)).toBeTruthy(),
		);

		const messageInput = screen.getByTestId("SignMessage__message-input");

		act(() => {
			fireEvent.input(messageInput, { target: { value: "Hello World" } });
		});

		await waitFor(() => expect(screen.getByTestId("SignMessage__submit-button")).toBeEnabled());

		act(() => {
			fireEvent.click(screen.getByTestId("SignMessage__submit-button"));
		});

		await waitFor(
			() => {
				expect(toastSpy).toHaveBeenCalledWith(walletTranslations.MODAL_LEDGER_WALLET.NO_DEVICE_FOUND);
			},
			{
				timeout: 4000,
			},
		);

		toastSpy.mockRestore();
		transportSpy.mockRestore();
		isLedgerMock.mockRestore();
		listenSpy.mockRestore();
	});

	it("should render with a custom message", async () => {
		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<SignMessage
						profile={profile}
						messageText="My Custom Message"
						walletId={wallet.id()}
						isOpen={true}
					/>
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		await waitFor(() => expect(screen.getByTestId("SignMessage__message-input")).toHaveValue("My Custom Message"));
	});
});
