import { Contracts } from "@payvo/profiles";
import userEvent from "@testing-library/user-event";
import { LedgerProvider } from "app/contexts/Ledger/Ledger";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import * as useQRCodeHook from "domains/wallet/components/ReceiveFunds/hooks";
import { translations as walletTranslations } from "domains/wallet/i18n";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import {
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	render,
	screen,
	waitFor,
	within,
} from "utils/testing-library";

import { WalletHeader } from "./WalletHeader";

const history = createMemoryHistory();

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;

let walletUrl: string;

const clickItem = (label: string) => {
	fireEvent.click(screen.getByTestId("dropdown__toggle"));
	fireEvent.click(within(screen.getByTestId("dropdown__content")).getByText(label));
};

describe("WalletHeader", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();

		await wallet.synchroniser().votes();
		await wallet.synchroniser().identity();
		await wallet.synchroniser().coin();

		walletUrl = `/profiles/${profile.id()}/wallets/${wallet.id()}`;

		jest.spyOn(useQRCodeHook, "useQRCode").mockImplementation(() => ({}));
	});

	afterAll(() => {
		useQRCodeHook.useQRCode.mockRestore();
	});

	it("should render", async () => {
		const { asFragment, findByText } = render(<WalletHeader profile={profile} wallet={wallet} />);
		await findByText(wallet.address());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should use empty string in clipboard copy if publickey is undefined", async () => {
		const mockpublicKey = jest.spyOn(wallet, "publicKey").mockReturnValue(undefined);
		const { asFragment, findByText } = render(<WalletHeader profile={profile} wallet={wallet} />);
		await findByText(wallet.address());

		expect(asFragment()).toMatchSnapshot();

		mockpublicKey.mockRestore();
	});

	it("should render amount for wallet in live network", async () => {
		const mockTestNetwork = jest.spyOn(wallet.network(), "isTest").mockReturnValue(false);
		const { asFragment, findByText } = render(<WalletHeader profile={profile} wallet={wallet} />);
		await findByText(wallet.address());

		expect(asFragment()).toMatchSnapshot();

		mockTestNetwork.mockRestore();
	});

	it("should hide second signature option", async () => {
		const mockIsSecondSignature = jest.spyOn(wallet, "isSecondSignature").mockReturnValue(true);
		const mockAllowsSecondSignature = jest.spyOn(wallet.network(), "allows").mockReturnValue(false);

		const { getByTestId, findByText } = render(<WalletHeader profile={profile} wallet={wallet} />);
		await findByText(wallet.address());

		fireEvent.click(getByTestId("dropdown__toggle"));

		await waitFor(() =>
			expect(() =>
				within(getByTestId("dropdown__content")).getByText(
					walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.SECOND_SIGNATURE,
				),
			).toThrow(/Unable to find an element/),
		);

		mockIsSecondSignature.mockRestore();
		mockAllowsSecondSignature.mockRestore();
	});

	it("should trigger onSend callback if provided", async () => {
		const onSend = jest.fn();

		const { getByTestId, findByText } = render(<WalletHeader profile={profile} wallet={wallet} onSend={onSend} />);
		await findByText(wallet.address());

		expect(getByTestId("WalletHeader__send-button")).toBeEnabled();

		fireEvent.click(getByTestId("WalletHeader__send-button"));

		expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("send button should be disabled if wallet has no balance", async () => {
		const balanceSpy = jest.spyOn(wallet, "balance").mockReturnValue(0);

		const { getByTestId, findByText } = render(<WalletHeader profile={profile} wallet={wallet} />);
		await findByText(wallet.address());

		expect(getByTestId("WalletHeader__send-button")).toBeDisabled();

		balanceSpy.mockRestore();
	});

	it("should show modifiers", async () => {
		const ledgerSpy = jest.spyOn(wallet, "isLedger").mockReturnValue(true);
		const multisigSpy = jest.spyOn(wallet, "isMultiSignature").mockReturnValue(true);

		const { asFragment, getByTestId, findByText } = render(<WalletHeader profile={profile} wallet={wallet} />);
		await findByText(wallet.address());

		expect(getByTestId("WalletIcon__Ledger")).toBeInTheDocument();
		expect(getByTestId("WalletIcon__Multisignature")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();

		ledgerSpy.mockRestore();
		multisigSpy.mockRestore();
	});

	it("should hide converted balance if wallet belongs to test network", async () => {
		const networkSpy = jest.spyOn(wallet.network(), "isTest").mockReturnValue(true);

		const { getByTestId, findByText } = render(<WalletHeader profile={profile} wallet={wallet} />);
		await findByText(wallet.address());

		expect(() => getByTestId("WalletHeader__currency-balance")).toThrow(/Unable to find/);

		networkSpy.mockRestore();
	});

	it.each([-5, 5])("should show currency delta (%s%)", (delta) => {
		const { getByText, asFragment } = render(
			<WalletHeader profile={profile} wallet={wallet} currencyDelta={delta} />,
		);

		if (delta < 0) {
			expect(getByText("chevron-down-small.svg")).toBeInTheDocument();
		} else {
			expect(getByText("chevron-up-small.svg")).toBeInTheDocument();
		}

		expect(getByText(`${delta}%`)).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it.each(["cancel", "close"])("should open & %s sign message modal", async (action) => {
		const transport = getDefaultLedgerTransport();

		history.push(walletUrl);

		const { getByTestId, getByText } = render(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<LedgerProvider transport={transport}>
					<WalletHeader profile={profile} wallet={wallet} />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.SIGN_MESSAGE);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(
				walletTranslations.MODAL_SIGN_MESSAGE.FORM_STEP.TITLE,
			),
		);

		if (action === "close") {
			fireEvent.click(getByTestId("modal__close-btn"));
		} else {
			fireEvent.click(getByText(commonTranslations.CANCEL));
		}

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it.each(["cancel", "close"])("should open & %s verify message modal", async (action) => {
		const { getByTestId, getByText } = render(<WalletHeader profile={profile} wallet={wallet} />);

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.VERIFY_MESSAGE);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(walletTranslations.MODAL_VERIFY_MESSAGE.TITLE),
		);

		if (action === "close") {
			fireEvent.click(getByTestId("modal__close-btn"));
		} else {
			fireEvent.click(getByText(commonTranslations.CANCEL));
		}

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it.each(["cancel", "close"])("should open & %s delete wallet modal", async (action) => {
		const { getByTestId, getByText } = render(<WalletHeader profile={profile} wallet={wallet} />);

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.DELETE);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(walletTranslations.MODAL_DELETE_WALLET.TITLE),
		);

		if (action === "close") {
			fireEvent.click(getByTestId("modal__close-btn"));
		} else {
			fireEvent.click(getByText(commonTranslations.CANCEL));
		}

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it.each(["cancel", "close"])("should open & %s wallet name modal", async (action) => {
		const { getByTestId, getByText } = render(<WalletHeader profile={profile} wallet={wallet} />);

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.WALLET_NAME);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(walletTranslations.MODAL_NAME_WALLET.TITLE),
		);

		if (action === "close") {
			fireEvent.click(getByTestId("modal__close-btn"));
		} else {
			fireEvent.click(getByText(commonTranslations.CANCEL));
		}

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it("should open & close receive funds modal", async () => {
		const { getByTestId, findByText } = render(<WalletHeader profile={profile} wallet={wallet} />);
		await findByText(wallet.address());

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.RECEIVE_FUNDS);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(walletTranslations.MODAL_RECEIVE_FUNDS.TITLE),
		);

		fireEvent.click(getByTestId("modal__close-btn"));

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
	});

	it("should manually sync wallet data", async () => {
		const { getByTestId } = render(<WalletHeader profile={profile} wallet={wallet} />);

		fireEvent.click(getByTestId("WalletHeader__refresh"));

		expect(getByTestId("WalletHeader__refresh")).toHaveAttribute("aria-busy", "true");

		await waitFor(() => expect(getByTestId("WalletHeader__refresh")).toHaveAttribute("aria-busy", "false"));
	});

	it("should handle multisignature registration", () => {
		history.push(walletUrl);

		const historySpy = jest.spyOn(history, "push");

		render(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<WalletHeader profile={profile} wallet={wallet} />
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.MULTISIGNATURE);

		expect(historySpy).toHaveBeenCalledWith(
			`/profiles/${profile.id()}/wallets/${wallet.id()}/send-registration/multiSignature`,
		);

		historySpy.mockRestore();
	});

	it("should handle second signature registration", () => {
		history.push(walletUrl);

		const historySpy = jest.spyOn(history, "push");

		render(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<WalletHeader profile={profile} wallet={wallet} />
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.SECOND_SIGNATURE);

		expect(historySpy).toHaveBeenCalledWith(
			`/profiles/${profile.id()}/wallets/${wallet.id()}/send-registration/secondSignature`,
		);

		historySpy.mockRestore();
	});

	it("should handle delegate registration", () => {
		history.push(walletUrl);

		const historySpy = jest.spyOn(history, "push");

		render(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<WalletHeader profile={profile} wallet={wallet} />
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.REGISTER_DELEGATE);

		expect(historySpy).toHaveBeenCalledWith(
			`/profiles/${profile.id()}/wallets/${wallet.id()}/send-registration/delegateRegistration`,
		);

		historySpy.mockRestore();
	});

	it("should handle delegate resignation", () => {
		history.push(walletUrl);

		const walletSpy = jest.spyOn(wallet, "isDelegate").mockReturnValue(true);
		const historySpy = jest.spyOn(history, "push");

		render(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<WalletHeader profile={profile} wallet={wallet} />
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.RESIGN_DELEGATE);

		expect(historySpy).toHaveBeenCalledWith(
			`/profiles/${profile.id()}/wallets/${wallet.id()}/send-delegate-resignation`,
		);

		historySpy.mockRestore();
		walletSpy.mockRestore();
	});

	it("should handle store hash option", () => {
		history.push(walletUrl);

		const historySpy = jest.spyOn(history, "push");

		render(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<WalletHeader profile={profile} wallet={wallet} />
			</Route>,
			{
				history,
				routes: [walletUrl],
			},
		);

		clickItem(walletTranslations.PAGE_WALLET_DETAILS.OPTIONS.STORE_HASH);

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}/send-ipfs`);

		historySpy.mockRestore();
	});

	it("should handle isMultiSignature exception", async () => {
		await wallet.synchroniser().identity();

		const multisigSpy = jest.spyOn(wallet, "isMultiSignature").mockImplementationOnce(() => {
			throw new Error("error");
		});

		const { getByTestId, findByText } = render(<WalletHeader profile={profile} wallet={wallet} />);
		await findByText(wallet.address());

		expect(() => getByTestId("WalletIcon__Multisignature")).toThrow(/Unable to find an element by/);

		multisigSpy.mockRestore();
	});

	it("should handle locked balance", async () => {
		const usesLockedBalance = jest.spyOn(wallet.network(), "usesLockedBalance").mockReturnValue(true);
		const balance = jest.spyOn(wallet, "balance").mockReturnValue(10);
		const unlockableBalances = jest
			.spyOn(wallet.coin().client(), "unlockableBalances")
			.mockResolvedValue({ objects: [] } as any);
		const allowsLockedBalance = jest.spyOn(wallet.network(), "allows").mockReturnValue(true);

		const { asFragment } = render(
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<WalletHeader profile={profile} wallet={wallet} />
			</LedgerProvider>,
		);
		await screen.findByText(wallet.address());

		expect(screen.getByTestId("WalletHeader__balance-locked")).toHaveTextContent("10");
		expect(asFragment()).toMatchSnapshot();

		userEvent.click(screen.getByTestId("WalletHeader__locked-balance-button"));

		await screen.findByTestId("UnlockTokensModal");

		userEvent.click(screen.getByTestId("modal__close-btn"));

		await waitFor(() =>
			expect(() => screen.getByTestId("UnlockTokensModal")).toThrow(/Unable to find an element by/),
		);

		usesLockedBalance.mockRestore();
		balance.mockRestore();
		unlockableBalances.mockRestore();
		allowsLockedBalance.mockRestore();
	});
});
