import { Contracts } from "@payvo/sdk";
import { BigNumber } from "@payvo/sdk-helpers";
import { Contracts as ProfileContracts } from "@payvo/sdk-profiles";
import { act as actHook, renderHook } from "@testing-library/react-hooks";
import { LedgerProvider } from "app/contexts";
import React from "react";
import transactionFixture from "tests/fixtures/coins/ark/devnet/transactions/transfer.json";
import {
	defaultNetMocks,
	env,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	getDefaultWalletMnemonic,
	waitFor,
	WithProviders,
} from "utils/testing-library";

import { useTransactionBuilder } from "./use-transaction-builder";

const createTransactionMock = (wallet: Contracts.IReadWriteWallet) =>
	// @ts-ignore
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => BigNumber.make(transactionFixture.data.amount),
		data: () => ({ data: () => transactionFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${transactionFixture.data.id}`,
		fee: () => BigNumber.make(transactionFixture.data.fee),
		id: () => transactionFixture.data.id,
		recipient: () => transactionFixture.data.recipient,
		sender: () => transactionFixture.data.sender,
	});

describe("Use Transaction Builder with Ledger", () => {
	let profile: ProfileContracts.IProfile;
	let wallet: ProfileContracts.IReadWriteWallet;
	const transport = getDefaultLedgerTransport();

	const wrapper = ({ children }: any) => (
		<WithProviders>
			<LedgerProvider transport={transport}>{children}</LedgerProvider>
		</WithProviders>
	);

	beforeAll(() => {
		defaultNetMocks();
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();
	});

	it("should sign transfer with ledger", async () => {
		const { result } = renderHook(() => useTransactionBuilder(profile), { wrapper });
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();
		jest.spyOn(wallet.coin().ledger(), "getPublicKey").mockResolvedValue(
			"027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582",
		);
		jest.spyOn(wallet, "isLedger").mockImplementation(() => true);
		jest.spyOn(wallet.transaction(), "signTransfer").mockResolvedValue(transactionFixture.data.id);

		createTransactionMock(wallet);

		const signatory = await wallet.signatory().mnemonic(getDefaultWalletMnemonic());

		const input: Contracts.TransferInput = {
			data: {
				amount: "1",
				to: wallet.address(),
			},
			fee: "1",
			nonce: "1",
			signatory,
		};

		let transaction: any;

		await actHook(async () => {
			transaction = (await result.current.build("transfer", input, wallet)).transaction;
		});

		await waitFor(() => expect(transaction.id()).toBe(transactionFixture.data.id));

		jest.clearAllMocks();
	});

	it("should sign transfer with cold ledger wallet", async () => {
		const { result } = renderHook(() => useTransactionBuilder(), { wrapper });
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();
		jest.spyOn(wallet, "publicKey").mockImplementation(() => undefined);
		jest.spyOn(wallet, "isLedger").mockImplementation(() => true);

		jest.spyOn(wallet.coin().ledger(), "getPublicKey").mockResolvedValue(
			"0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb",
		);

		jest.spyOn(wallet.transaction(), "signTransfer").mockResolvedValue(transactionFixture.data.id);
		createTransactionMock(wallet);

		const signatory = await wallet.signatory().mnemonic(getDefaultWalletMnemonic());
		const input: Contracts.TransferInput = {
			data: {
				amount: "1",
				to: wallet.address(),
			},
			fee: "1",
			nonce: "1",
			signatory,
		};

		let transaction: any;

		await actHook(async () => {
			transaction = (await result.current.build("transfer", input, wallet)).transaction;
		});

		expect(transaction.id()).toBe(transactionFixture.data.id);

		jest.clearAllMocks();
	});

	it("should abort build with ledger", async () => {
		const abortCtrl = new AbortController();
		const abortSignal = abortCtrl.signal;

		const { result } = renderHook(() => useTransactionBuilder(profile), { wrapper });

		jest.spyOn(wallet, "isLedger").mockImplementation(() => true);
		jest.spyOn(wallet.signatory(), "ledger").mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(() => {
						resolve();
					}, 20_000),
				),
		);

		createTransactionMock(wallet);
		const signatory = await wallet.signatory().mnemonic(getDefaultWalletMnemonic());

		const input: Contracts.TransferInput = {
			data: {
				amount: "1",
				to: wallet.address(),
			},
			fee: "1",
			nonce: "1",
			signatory,
		};

		setTimeout(() => abortCtrl.abort(), 100);
		let error: string;

		await actHook(async () => {
			try {
				await result.current.build("transfer", input, wallet, { abortSignal });
			} catch (error_) {
				error = error_;
			}
		});

		await waitFor(() => expect(error).toBe("ERR_ABORT"));

		jest.clearAllMocks();
	});
});
