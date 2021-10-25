import { Contracts, DTO } from "@payvo/profiles";
import { LedgerProvider, minVersionList } from "app/contexts";
import { toasts } from "app/services";
import React from "react";
import { Route } from "react-router-dom";
import MultisignatureRegistrationFixture from "tests/fixtures/coins/ark/devnet/transactions/multisignature-registration.json";
import {
	act,
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	getDefaultWalletMnemonic,
	renderWithRouter,
	screen,
	syncDelegates,
	waitFor,
} from "utils/testing-library";

import { translations } from "../../i18n";
import { MultiSignatureDetail } from "./MultiSignatureDetail";

const passphrase = getDefaultWalletMnemonic();

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
let getVersionSpy: jest.SpyInstance;

const fixtures: Record<string, any> = {
	ipfs: undefined,
	multiPayment: undefined,
	multiSignature: undefined,
	transfer: undefined,
	unvote: undefined,
	vote: undefined,
};

jest.setTimeout(15_000);

beforeEach(async () => {
	profile = env.profiles().findById(getDefaultProfileId());

	await env.profiles().restore(profile);
	await profile.sync();

	await syncDelegates(profile);

	wallet = profile.wallets().first();

	getVersionSpy = jest
		.spyOn(wallet.coin().ledger(), "getVersion")
		.mockResolvedValue(minVersionList[wallet.network().coin()]);

	await wallet.synchroniser().identity();

	fixtures.transfer = new DTO.ExtendedSignedTransactionData(
		await wallet
			.coin()
			.transaction()
			.transfer({
				data: {
					amount: 1,
					to: wallet.address(),
				},
				fee: 1,
				nonce: "1",
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature({
						min: 2,
						publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
					}),
			}),
		wallet,
	);

	fixtures.multiSignature = new DTO.ExtendedSignedTransactionData(
		await wallet
			.coin()
			.transaction()
			.multiSignature({
				data: {
					min: 2,
					publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
					senderPublicKey: wallet.publicKey()!,
				},
				fee: 1,
				nonce: "1",
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature({
						min: 2,
						publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
					}),
			}),
		wallet,
	);

	fixtures.multiPayment = new DTO.ExtendedSignedTransactionData(
		await wallet
			.coin()
			.transaction()
			.multiPayment({
				data: {
					payments: [
						{
							amount: 1,
							to: wallet.address(),
						},
						{
							amount: 2,
							to: wallet.address(),
						},
					],
				},
				fee: 1,
				nonce: "1",
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature({
						min: 2,
						publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
					}),
			}),
		wallet,
	);

	fixtures.vote = new DTO.ExtendedSignedTransactionData(
		await wallet
			.coin()
			.transaction()
			.vote({
				data: {
					unvotes: [],
					votes: [
						{
							amount: 0,
							id: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
						},
					],
				},
				fee: 1,
				nonce: "1",
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature({
						min: 2,
						publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
					}),
			}),
		wallet,
	);

	fixtures.unvote = new DTO.ExtendedSignedTransactionData(
		await wallet
			.coin()
			.transaction()
			.vote({
				data: {
					unvotes: [
						{
							amount: 0,
							id: "034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192",
						},
					],
					votes: [],
				},
				fee: 1,
				nonce: "1",
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature({
						min: 2,
						publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
					}),
			}),
		wallet,
	);

	fixtures.ipfs = new DTO.ExtendedSignedTransactionData(
		await wallet
			.coin()
			.transaction()
			.ipfs({
				data: {
					hash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
				},
				fee: 1,
				nonce: "1",
				signatory: await wallet
					.coin()
					.signatory()
					.multiSignature({
						min: 2,
						publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
					}),
			}),
		wallet,
	);
});

afterAll(() => {
	getVersionSpy.mockRestore();
});

describe("MultiSignatureDetail", () => {
	it("should render summary step for transfer", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_TYPES.TRANSFER)));

		expect(container).toMatchSnapshot();
	});

	it("should render summary step and handle exception", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => {
			throw new Error("error");
		});

		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_TYPES.TRANSFER)));

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for multi payment", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail
						profile={profile}
						transaction={fixtures.multiPayment}
						wallet={wallet}
						isOpen
					/>
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_TYPES.MULTI_PAYMENT)));

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for multi signature", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail
						profile={profile}
						transaction={fixtures.multiSignature}
						wallet={wallet}
						isOpen
					/>
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_TYPES.MULTI_SIGNATURE)));

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for vote", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);
		jest.spyOn(fixtures.vote, "type").mockReturnValue("vote");

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.vote} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() =>
			expect(screen.getByTestId("header__title")).toHaveTextContent(translations.TRANSACTION_TYPES.VOTE),
		);

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for unvote", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);
		jest.spyOn(fixtures.unvote, "type").mockReturnValue("unvote");

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.unvote} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() =>
			expect(screen.getByTestId("header__title")).toHaveTextContent(translations.TRANSACTION_TYPES.UNVOTE),
		);

		expect(container).toMatchSnapshot();
	});

	it("should render summary step for ipfs", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "isAwaitingSignatureByPublicKey").mockImplementation(() => false);

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.ipfs} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);
		await waitFor(() =>
			expect(screen.getByTestId("header__title")).toHaveTextContent(translations.TRANSACTION_TYPES.IPFS),
		);

		expect(container).toMatchSnapshot();
	});

	it("should show send button when able to add final signature and broadcast", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.coin().multiSignature(), "isMultiSignatureReady").mockReturnValue(true);
		jest.spyOn(wallet.transaction(), "transaction").mockReturnValue(fixtures.transfer);

		// @ts-ignore
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue(void 0);

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("MultiSignatureDetail__broadcast")));

		expect(container).toMatchSnapshot();

		act(() => {
			fireEvent.click(screen.getByTestId("MultiSignatureDetail__broadcast"));
		});

		await waitFor(() => expect(broadcastMock).toHaveBeenCalled());
		await waitFor(() => expect(screen.getByText(translations.SUCCESS.TITLE)).toBeInTheDocument());

		broadcastMock.mockRestore();
	});

	it("should not broadcast if wallet is not ready to do so", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.coin().multiSignature(), "isMultiSignatureReady").mockReturnValue(true);
		// @ts-ignore
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue(void 0);

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("MultiSignatureDetail__broadcast")));

		expect(container).toMatchSnapshot();

		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockReturnValue(false);

		act(() => {
			fireEvent.click(screen.getByTestId("MultiSignatureDetail__broadcast"));
		});

		await waitFor(() => expect(broadcastMock).not.toHaveBeenCalled());

		broadcastMock.mockRestore();
	});

	it("should not show send button when waiting for confirmations", async () => {
		jest.spyOn(wallet.transaction(), "isAwaitingConfirmation").mockImplementationOnce(() => true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => false);
		jest.spyOn(wallet.coin().multiSignature(), "isMultiSignatureReady").mockReturnValue(true);

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.queryByTestId("MultiSignatureDetail__broadcast")).not.toBeInTheDocument());

		expect(container).toMatchSnapshot();
	});

	it("should fail to broadcast transaction and show error step", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.coin().multiSignature(), "isMultiSignatureReady").mockReturnValue(true);

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockRejectedValue(new Error("Failed"));

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("MultiSignatureDetail__broadcast")));

		expect(container).toMatchSnapshot();

		act(() => {
			fireEvent.click(screen.getByTestId("MultiSignatureDetail__broadcast"));
		});

		await waitFor(() => expect(screen.getByTestId("ErrorStep")));
		await waitFor(() => expect(broadcastMock).toHaveBeenCalled());
		broadcastMock.mockRestore();
	});

	it("should show sign button when able to sign", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__back"));
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		expect(container).toMatchSnapshot();
	});

	it("should emit close when click on cancel button", async () => {
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);

		const onClose = jest.fn();
		renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail
						profile={profile}
						transaction={fixtures.transfer}
						wallet={wallet}
						isOpen
						onClose={onClose}
					/>
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("Paginator__cancel")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__cancel"));
		});

		expect(onClose).toHaveBeenCalled();
	});

	it("should go to authentication step with sign button", async () => {
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);

		renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")).toBeInTheDocument());
	});

	it("should sign transaction after authentication page", async () => {
		jest.spyOn(wallet, "actsWithMnemonic").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "sync").mockResolvedValue(void 0);
		jest.spyOn(wallet.transaction(), "transaction").mockReturnValue(fixtures.transfer);

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast");
		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue({
			accepted: [fixtures.transfer.id()],
			errors: {},
			rejected: [],
		});

		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const transport = getDefaultLedgerTransport();
		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={transport}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoX" }, type: "add" });
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")).toBeInTheDocument());

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__continue")).not.toBeDisabled(), { timeout: 1000 });

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__continue"));
		});

		await waitFor(() => expect(addSignatureMock).toHaveBeenCalled());
		await waitFor(() => expect(broadcastMock).not.toHaveBeenCalled());
		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_SIGNED)).toBeInTheDocument());

		expect(container).toMatchSnapshot();

		listenSpy.mockRestore();
	});

	it("should fail to sign transaction after authentication page", async () => {
		jest.spyOn(wallet, "actsWithMnemonic").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "sync").mockResolvedValue(void 0);

		const addSignatureMock = jest
			.spyOn(wallet.transaction(), "addSignature")
			.mockRejectedValue(new Error("Failed"));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast");
		const toastsMock = jest.spyOn(toasts, "error");

		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const transport = getDefaultLedgerTransport();
		jest.spyOn(transport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

		renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={transport}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoX" }, type: "add" });
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")).toBeInTheDocument());

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__continue")).not.toBeDisabled(), { timeout: 1000 });

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__continue"));
		});

		await waitFor(() => expect(addSignatureMock).toHaveBeenCalled());
		await waitFor(() => expect(toastsMock).toHaveBeenCalled());
		await waitFor(() => expect(broadcastMock).not.toHaveBeenCalled());
		jest.restoreAllMocks();
	});

	it("should add final signature and broadcast transaction", async () => {
		jest.spyOn(wallet.transaction(), "isAwaitingOurSignature").mockReturnValue(false);
		jest.spyOn(wallet.transaction(), "isAwaitingOtherSignatures").mockReturnValue(false);
		jest.spyOn(wallet.coin().multiSignature(), "isMultiSignatureReady").mockReturnValue(false);
		jest.spyOn(wallet.transaction(), "isAwaitingConfirmation").mockReturnValue(false);

		jest.spyOn(wallet, "actsWithMnemonic").mockReturnValue(true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockReturnValue(true);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockReturnValue(true);
		jest.spyOn(wallet.transaction(), "sync").mockResolvedValue(void 0);
		jest.spyOn(wallet.transaction(), "transaction").mockReturnValue(fixtures.transfer);

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [fixtures.transfer.id()],
			errors: {},
			rejected: [],
		});
		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue({
			accepted: [fixtures.transfer.id()],
			errors: {},
			rejected: [],
		});

		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const transport = getDefaultLedgerTransport();
		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});

		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={transport}>
					<MultiSignatureDetail profile={profile} transaction={fixtures.transfer} wallet={wallet} isOpen />
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoX" }, type: "add" });
		});

		await waitFor(() => expect(screen.getByTestId("MultiSignatureDetail__broadcast")).toBeInTheDocument());

		act(() => {
			fireEvent.click(screen.getByTestId("MultiSignatureDetail__broadcast"));
		});

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep")).toBeInTheDocument());

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__continue")).not.toBeDisabled(), { timeout: 1000 });

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__continue"));
		});

		await waitFor(() => expect(addSignatureMock).toHaveBeenCalled());
		await waitFor(() => expect(broadcastMock).toHaveBeenCalled());
		await waitFor(() => expect(screen.getByText(translations.SUCCESS.TITLE)).toBeInTheDocument());

		expect(container).toMatchSnapshot();

		listenSpy.mockRestore();
		jest.restoreAllMocks();
	});

	it("should sign transaction with a ledger wallet", async () => {
		jest.spyOn(wallet.transaction(), "isAwaitingOurSignature").mockReturnValue(true);

		jest.spyOn(wallet, "actsWithMnemonic").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "sync").mockResolvedValue(void 0);
		jest.spyOn(wallet.transaction(), "transaction").mockReturnValue(fixtures.transfer);

		const isNanoXMock = jest.spyOn(wallet, "isLedgerNanoX").mockReturnValue(true);
		// Ledger mocks
		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockImplementation(() => true);
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();

		const getPublicKeyMock = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue("0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb");

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [MultisignatureRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});

		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue(undefined);

		const addSignatureSpy = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue(undefined);

		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const transport = getDefaultLedgerTransport();
		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});
		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={transport}>
					<MultiSignatureDetail
						profile={profile}
						transaction={fixtures.multiSignature}
						wallet={wallet}
						isOpen
					/>
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoX" }, type: "add" });
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")).toBeInTheDocument());

		const address = wallet.address();
		const balance = wallet.balance();
		const derivationPath = "m/44'/1'/1'/0/0";
		const votes = wallet.voting().current();
		const publicKey = wallet.publicKey();

		const mockWalletData = jest.spyOn(wallet.data(), "get").mockImplementation((key) => {
			if (key == Contracts.WalletData.Address) {
				return address;
			}

			if (key == Contracts.WalletData.Balance) {
				return balance;
			}

			if (key == Contracts.WalletData.PublicKey) {
				return publicKey;
			}

			if (key == Contracts.WalletData.Votes) {
				return votes;
			}

			if (key === Contracts.WalletData.ImportMethod) {
				return "BIP44.DERIVATION_PATH";
			}

			if (key == Contracts.WalletData.DerivationPath) {
				return derivationPath;
			}
		});

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(() => screen.getByTestId("Paginator__continue")), { timeout: 1000 });

		await waitFor(() => expect(addSignatureMock).toHaveBeenCalled());
		await waitFor(() => expect(broadcastMock).not.toHaveBeenCalled());

		expect(container).toMatchSnapshot();

		isLedgerMock.mockRestore();
		isNanoXMock.mockRestore();
		getPublicKeyMock.mockRestore();
		broadcastMock.mockRestore();
		addSignatureSpy.mockRestore();
		mockWalletData.mockRestore();
		listenSpy.mockRestore();
	});

	it("should show error screen for Nano S and continue when NanoX is connected", async () => {
		jest.spyOn(wallet.transaction(), "isAwaitingOurSignature").mockReturnValue(true);
		jest.spyOn(wallet, "actsWithMnemonic").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "canBeBroadcasted").mockImplementation(() => false);
		jest.spyOn(wallet.transaction(), "canBeSigned").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "sync").mockResolvedValue(void 0);
		jest.spyOn(wallet.transaction(), "transaction").mockReturnValue(fixtures.transfer);

		// Ledger mocks
		const isLedgerMock = jest.spyOn(wallet, "isLedger").mockImplementation(() => true);
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();

		const getPublicKeyMock = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue("0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb");

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [MultisignatureRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});

		const addSignatureMock = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue(undefined);

		const addSignatureSpy = jest.spyOn(wallet.transaction(), "addSignature").mockResolvedValue(undefined);

		const unsubscribe = jest.fn();
		let observer: Observer<any>;

		const transport = getDefaultLedgerTransport();
		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce((obv) => {
			observer = obv;
			return { unsubscribe };
		});
		const { container } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<LedgerProvider transport={transport}>
					<MultiSignatureDetail
						profile={profile}
						transaction={fixtures.multiSignature}
						wallet={wallet}
						isOpen
					/>
				</LedgerProvider>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoS" }, type: "add" });
		});

		await waitFor(() => expect(screen.getByTestId("Paginator__sign")));

		const address = wallet.address();
		const balance = wallet.balance();
		const derivationPath = "m/44'/1'/1'/0/0";
		const votes = wallet.voting().current();
		const publicKey = wallet.publicKey();

		const mockWalletData = jest.spyOn(wallet.data(), "get").mockImplementation((key) => {
			if (key === Contracts.WalletData.Address) {
				return address;
			}

			if (key === Contracts.WalletData.Balance) {
				return balance;
			}

			if (key === Contracts.WalletData.PublicKey) {
				return publicKey;
			}

			if (key === Contracts.WalletData.Votes) {
				return votes;
			}

			if (key === Contracts.WalletData.ImportMethod) {
				return "BIP44.DERIVATION_PATH";
			}

			if (key === Contracts.WalletData.DerivationPath) {
				return derivationPath;
			}
		});

		act(() => {
			fireEvent.click(screen.getByTestId("Paginator__sign"));
		});

		await waitFor(() => expect(screen.getByTestId("LedgerDeviceError")).toBeInTheDocument());

		act(() => {
			observer!.next({ descriptor: "", deviceModel: { id: "nanoX" }, type: "add" });
		});

		await waitFor(() => expect(addSignatureMock).toHaveBeenCalled());
		await waitFor(() => expect(broadcastMock).not.toHaveBeenCalled());
		await waitFor(() => expect(screen.getByText(translations.TRANSACTION_SIGNED)).toBeInTheDocument());

		expect(container).toMatchSnapshot();

		isLedgerMock.mockRestore();
		getPublicKeyMock.mockRestore();
		broadcastMock.mockRestore();
		addSignatureSpy.mockRestore();
		mockWalletData.mockRestore();
		listenSpy.mockRestore();
	});
});
