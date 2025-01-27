import { Contracts } from "@payvo/sdk";
import { Contracts as ProfileContracts } from "@payvo/sdk-profiles";
import { act as actHook, renderHook } from "@testing-library/react-hooks";
import { LedgerProvider } from "app/contexts";
import React from "react";
import {
	defaultNetMocks,
	env,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	getDefaultWalletMnemonic,
	WithProviders,
} from "utils/testing-library";

import { useTransactionBuilder } from "./use-transaction-builder";

describe("Use Transaction Builder Hook", () => {
	let profile: ProfileContracts.IProfile;
	let wallet: ProfileContracts.IReadWriteWallet;
	const transport = getDefaultLedgerTransport();

	const wrapper = ({ children }: any) => (
		<WithProviders>
			<LedgerProvider transport={transport}>{children}</LedgerProvider>
		</WithProviders>
	);

	beforeAll(async () => {
		defaultNetMocks();
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();

		await profile.sync();
	});

	it("should sign transfer", async () => {
		const { result } = renderHook(() => useTransactionBuilder(profile), { wrapper });

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

		expect(transaction.id()).toBe("bad2e9a02690d7cb0efdddfff1f7eacdf4685e22c0b5c3077e1de67511e2553d");
	});

	it("should sign transfer with multisignature wallet", async () => {
		const { result } = renderHook(() => useTransactionBuilder(profile), { wrapper });

		jest.spyOn(wallet, "isMultiSignature").mockImplementation(() => true);
		jest.spyOn(wallet.multiSignature(), "all").mockReturnValue({
			min: 2,
			publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
		});

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

		expect(transaction.id()).toBe("6c38de343321f7d853ff98c1669aecee429ed51c13a473f6d39e3037d6685da4");

		jest.clearAllMocks();
	});
});
