/* eslint-disable @typescript-eslint/require-await */
import { Contracts, DTO } from "@payvo/sdk-profiles";
// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/sdk-profiles/distribution/read-only-wallet";
import { LedgerProvider } from "app/contexts";
import { buildTranslations } from "app/i18n/helpers";
import { toasts } from "app/services";
import electron from "electron";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import walletMock from "tests/fixtures/coins/ark/devnet/wallets/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD.json";
import {
	defaultNetMocks,
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	MNEMONICS,
	render,
	RenderResult,
	syncDelegates,
	waitFor,
	within,
} from "utils/testing-library";

import { WalletDetails } from "./WalletDetails";

const translations = buildTranslations();

const history = createMemoryHistory();
let walletUrl: string;

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
let blankWallet: Contracts.IReadWriteWallet;
let unvotedWallet: Contracts.IReadWriteWallet;

let emptyProfile: Contracts.IProfile;
let wallet2: Contracts.IReadWriteWallet;

const passphrase2 = MNEMONICS[3];

const renderPage = async ({
	waitForTopSection = true,
	waitForTransactions = true,
	withProfileSynchronizer = false,
} = {}) => {
	const rendered: RenderResult = render(
		<Route path="/profiles/:profileId/wallets/:walletId">
			<LedgerProvider transport={getDefaultLedgerTransport()}>
				<WalletDetails />
			</LedgerProvider>
			,
		</Route>,
		{
			history,
			routes: [walletUrl],
			withProfileSynchronizer,
		},
	);

	const { getByTestId, findByTestId } = rendered;

	if (waitForTopSection) {
		await findByTestId("WalletVote");
	}

	if (waitForTransactions) {
		await (withProfileSynchronizer
			? waitFor(() =>
					expect(within(getByTestId("TransactionTable")).queryAllByTestId("TableRow")).toHaveLength(1),
			  )
			: waitFor(() =>
					expect(within(getByTestId("TransactionTable")).queryAllByTestId("TableRow")).not.toHaveLength(0),
			  ));
	}

	return rendered;
};

describe("WalletDetails", () => {
	const fixtures: Record<string, any> = {
		ipfs: undefined,
		multiPayment: undefined,
		multiSignature: undefined,
		transfer: undefined,
		unvote: undefined,
		vote: undefined,
	};

	const mockPendingTransfers = (wallet: Contracts.IReadWriteWallet) => {
		jest.spyOn(wallet.transaction(), "signed").mockReturnValue({
			[fixtures.transfer.id()]: fixtures.transfer,
		});
		jest.spyOn(wallet.transaction(), "canBeSigned").mockReturnValue(true);
		jest.spyOn(wallet.transaction(), "hasBeenSigned").mockReturnValue(true);
		jest.spyOn(wallet.transaction(), "isAwaitingConfirmation").mockReturnValue(true);
		jest.spyOn(wallet.transaction(), "transaction").mockImplementation(() => fixtures.transfer);
	};

	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		blankWallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: passphrase2,
			network: "ark.devnet",
		});

		unvotedWallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});

		emptyProfile = env.profiles().findById("cba050f1-880f-45f0-9af9-cfe48f406052");

		wallet2 = await emptyProfile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[1],
			network: "ark.devnet",
		});

		profile.wallets().push(blankWallet);
		profile.wallets().push(unvotedWallet);
		emptyProfile.wallets().push(wallet2);

		await syncDelegates(profile);

		nock("https://ark-test.payvo.com")
			.get("/api/delegates")
			.query({ page: "1" })
			.reply(200, require("tests/fixtures/coins/ark/devnet/delegates.json"))
			.get(`/api/wallets/${unvotedWallet.address()}`)
			.reply(200, walletMock)
			.get(`/api/wallets/${blankWallet.address()}`)
			.reply(404, {
				error: "Not Found",
				message: "Wallet not found",
				statusCode: 404,
			})
			.get(`/api/wallets/${wallet2.address()}`)
			.reply(404, {
				error: "Not Found",
				message: "Wallet not found",
				statusCode: 404,
			})
			.get("/api/transactions")
			.query((parameters) => !!parameters.address)
			.reply(200, (url) => {
				const { meta, data } = require("tests/fixtures/coins/ark/devnet/transactions.json");
				const filteredUrl =
					"/api/transactions?page=1&limit=1&address=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD&type=0&typeGroup=1";
				if (url === filteredUrl) {
					return { data: [], meta };
				}

				return {
					data: data.slice(0, 1),
					meta,
				};
			})
			.persist();

		// Mock musig server requests
		jest.spyOn(wallet.transaction(), "sync").mockResolvedValue(void 0);
	});

	beforeEach(async () => {
		fixtures.transfer = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.transfer({
					data: {
						amount: 1,
						to: wallet.address(),
					},
					fee: 0.1,
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

		walletUrl = `/profiles/${profile.id()}/wallets/${wallet.id()}`;
		history.push(walletUrl);
	});

	it("should render pending transactions and view details in modal", async () => {
		mockPendingTransfers(wallet);

		const { getByTestId, findByTestId } = await renderPage();
		await findByTestId("PendingTransactions");

		fireEvent.click(within(getByTestId("PendingTransactions")).getAllByTestId("TableRow")[0]);

		await findByTestId("modal__inner");

		fireEvent.click(getByTestId("modal__close-btn"));

		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/));
		jest.restoreAllMocks();
	});

	it("should remove pending multisignature transactions", async () => {
		mockPendingTransfers(wallet);

		const { getByTestId, findByTestId } = await renderPage();
		await findByTestId("PendingTransactions");

		fireEvent.click(within(getByTestId("PendingTransactions")).getAllByTestId("TableRow")[0]);

		await findByTestId("TableRemoveButton");
		fireEvent.click(getByTestId("TableRemoveButton"));

		await findByTestId("ConfirmRemovePendingTransaction__Transfer-Transaction");

		jest.restoreAllMocks();
		defaultNetMocks();
		nock("https://ark-test-musig.payvo.com/").get("/api/wallets/DDA5nM7KEqLeTtQKv5qGgcnc6dpNBKJNTS").reply(200, []);
		nock("https://ark-test-musig.payvo.com")
			.post("/")
			.reply(200, { result: { id: "03df6cd794a7d404db4f1b25816d8976d0e72c5177d17ac9b19a92703b62cdbbbc" } });

		const toastsMock = jest.spyOn(toasts, "success");

		fireEvent.click(getByTestId("ConfirmRemovePendingTransaction__remove"));

		await waitFor(() => expect(() => getByTestId("PendingTransactions")).toThrow(/Unable to find an element by/));

		expect(toastsMock).toHaveBeenCalledWith(translations.TRANSACTION.TRANSACTION_REMOVED);

		toastsMock.mockRestore();
	});

	it("should render pending multiSignatures and view details in modal", async () => {
		mockPendingTransfers(wallet);

		const { getByTestId, findByTestId } = await renderPage();
		await findByTestId("PendingTransactions");

		fireEvent.click(within(getByTestId("PendingTransactions")).getAllByTestId("TableRow")[0]);

		await findByTestId("modal__inner");

		fireEvent.click(getByTestId("modal__close-btn"));

		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/));
		jest.restoreAllMocks();
	});

	it("should navigate to send transfer", async () => {
		const { getByTestId, findByTestId } = await renderPage({ waitForTopSection: true });

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		await findByTestId("WalletHeader__send-button");
		await waitFor(() => expect(getByTestId("WalletHeader__send-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("WalletHeader__send-button"));

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}/send-transfer`);

		historySpy.mockRestore();
	});

	it("should not render wallet vote when the network does not support votes", async () => {
		const networkFeatureSpy = jest.spyOn(wallet.network(), "allowsVoting").mockReturnValue(false);

		const { getByTestId } = await renderPage({ waitForTopSection: false });

		await waitFor(() => {
			expect(() => getByTestId("WalletVote")).toThrow(/Unable to find an element by/);
		});

		networkFeatureSpy.mockRestore();
	});

	it("should render when wallet not found for votes", async () => {
		jest.spyOn(blankWallet, "isMultiSignature").mockReturnValue(false);

		walletUrl = `/profiles/${profile.id()}/wallets/${blankWallet.id()}`;
		history.push(walletUrl);

		const { findByText } = await renderPage({ waitForTopSection: true, waitForTransactions: false });

		await findByText(translations.COMMON.LEARN_MORE);
	});

	it("should navigate to votes page when clicking on WalletVote button", async () => {
		await profile.sync();

		const walletSpy = jest.spyOn(wallet.voting(), "current").mockReturnValue([]);
		const historySpy = jest.spyOn(history, "push");

		const { getByTestId, findByText } = await renderPage();

		await findByText(translations.COMMON.LEARN_MORE);
		await waitFor(() => expect(getByTestId("WalletVote__button")).not.toBeDisabled());

		fireEvent.click(getByTestId("WalletVote__button"));

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}/votes`);

		walletSpy.mockRestore();
		historySpy.mockRestore();
	});

	it('should navigate to votes with "current" filter param when clicking on Multivote', async () => {
		const walletSpy = jest.spyOn(wallet.voting(), "current").mockReturnValue([
			{
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: wallet.address(),
					explorerLink: "",
					publicKey: wallet.publicKey(),
					rank: 1,
					username: "arkx",
				}),
			},
			{
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: wallet.address(),
					explorerLink: "",
					publicKey: wallet.publicKey(),
					rank: 2,
					username: "arky",
				}),
			},
		]);
		const maxVotesSpy = jest.spyOn(wallet.network(), "maximumVotesPerWallet").mockReturnValue(101);
		const historySpy = jest.spyOn(history, "push");

		const { getByText } = await renderPage();

		fireEvent.click(getByText(translations.WALLETS.PAGE_WALLET_DETAILS.VOTES.MULTIVOTE));

		expect(historySpy).toHaveBeenCalledWith({
			pathname: `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`,
			search: "?filter=current",
		});

		walletSpy.mockRestore();
		maxVotesSpy.mockRestore();
		historySpy.mockRestore();
	});

	it("should update wallet name", async () => {
		const { getByTestId, getAllByTestId, findByTestId } = await renderPage();

		fireEvent.click(getAllByTestId("dropdown__toggle")[2]);

		fireEvent.click(getByTestId("dropdown__option--primary-0"));

		await findByTestId("modal__inner");

		const name = "Sample label name";

		fireEvent.input(getByTestId("UpdateWalletName__input"), { target: { value: name } });

		await waitFor(() => expect(getByTestId("UpdateWalletName__submit")).toBeEnabled());

		fireEvent.click(getByTestId("UpdateWalletName__submit"));

		await waitFor(() => expect(wallet.settings().get(Contracts.WalletSetting.Alias)).toBe(name));
	});

	it("should star and unstar a wallet", async () => {
		const { getByTestId } = await renderPage();

		expect(wallet.isStarred()).toBe(false);

		fireEvent.click(getByTestId("WalletHeader__star-button"));

		await waitFor(() => expect(wallet.isStarred()).toBe(true));

		fireEvent.click(getByTestId("WalletHeader__star-button"));

		await waitFor(() => expect(wallet.isStarred()).toBe(false));
	});

	it("should open detail modal on transaction row click", async () => {
		const { getByTestId, findByTestId } = await renderPage({
			waitForTopSection: true,
			waitForTransactions: true,
			withProfileSynchronizer: true,
		});

		fireEvent.click(within(getByTestId("TransactionTable")).getAllByTestId("TableRow")[0]);

		await findByTestId("modal__inner");

		fireEvent.click(getByTestId("modal__close-btn"));

		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/));
	});

	it("should fetch more transactions", async () => {
		process.env.REACT_APP_IS_UNIT = "1";

		const { getByTestId, getAllByTestId } = await renderPage({
			waitForTopSection: true,
			waitForTransactions: true,
			withProfileSynchronizer: true,
		});

		const fetchMoreTransactionsButton = getByTestId("transactions__fetch-more-button");

		fireEvent.click(fetchMoreTransactionsButton);

		await waitFor(() => {
			expect(within(getAllByTestId("TransactionTable")[0]).queryAllByTestId("TableRow")).toHaveLength(2);
		});
	});

	it("should filter by type", async () => {
		const { getByRole, getByTestId, findByTestId } = await renderPage();

		fireEvent.click(getByRole("button", { name: /Type/ }));

		await findByTestId("dropdown__option--core-0");

		fireEvent.click(getByTestId("dropdown__option--core-0"));

		await waitFor(
			() => expect(within(getByTestId("TransactionTable")).queryAllByTestId("TableRow")).toHaveLength(8),
			{ timeout: 4000 },
		);
	});

	it("should open wallet in explorer", async () => {
		const ipcRendererMock = jest.spyOn(electron.ipcRenderer, "send").mockImplementation();
		const { getByTestId, getAllByTestId } = await renderPage();

		const dropdown = getAllByTestId("dropdown__toggle")[2];

		expect(dropdown).toBeInTheDocument();

		fireEvent.click(dropdown);

		const openWalletOption = getByTestId("dropdown__option--secondary-0");

		expect(openWalletOption).toBeInTheDocument();

		fireEvent.click(openWalletOption);

		expect(ipcRendererMock).toHaveBeenCalledWith("open-external", wallet.explorerLink());
	});

	it("should manually sync wallet data", async () => {
		const { getByTestId } = await renderPage();

		fireEvent.click(getByTestId("WalletHeader__refresh"));

		expect(getByTestId("WalletHeader__refresh")).toHaveAttribute("aria-busy", "true");

		await waitFor(() => expect(getByTestId("WalletHeader__refresh")).toHaveAttribute("aria-busy", "false"));
	});

	it("should delete wallet and clear associated transaction notifications", async () => {
		const { getByTestId, getAllByTestId, findByTestId } = await renderPage();

		const dropdown = getAllByTestId("dropdown__toggle")[2];

		expect(dropdown).toBeInTheDocument();

		fireEvent.click(dropdown);

		const deleteWalletOption = getByTestId("dropdown__option--secondary-1");

		expect(deleteWalletOption).toBeInTheDocument();

		fireEvent.click(deleteWalletOption);

		expect(profile.wallets().count()).toBe(4);
		expect(profile.notifications().transactions().recent()).toHaveLength(2);

		await findByTestId("modal__inner");

		fireEvent.click(getByTestId("DeleteResource__submit-button"));

		await waitFor(() => expect(profile.wallets().count()).toBe(3));

		expect(profile.notifications().transactions().recent()).toHaveLength(0);
	});

	it("should not fail if the votes have not yet been synchronized", async () => {
		const newWallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[2],
			network: "ark.devnet",
		});

		profile.wallets().push(newWallet);

		nock("https://ark-test.payvo.com").get(`/api/wallets/${newWallet.address()}`).reply(200, walletMock);

		await newWallet.synchroniser().identity();

		const syncVotesSpy = jest.spyOn(newWallet.synchroniser(), "votes").mockImplementation();

		walletUrl = `/profiles/${profile.id()}/wallets/${newWallet.id()}`;
		history.push(walletUrl);

		const { findByText } = await renderPage();

		await findByText(translations.COMMON.LEARN_MORE);

		syncVotesSpy.mockRestore();
	});
});
