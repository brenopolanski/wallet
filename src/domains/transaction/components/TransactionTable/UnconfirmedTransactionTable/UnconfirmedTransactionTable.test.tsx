import { BigNumber } from "@payvo/sdk-helpers";
import { DateTime } from "@payvo/sdk-intl";
import { Contracts, DTO } from "@payvo/sdk-profiles";
import React from "react";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { UnconfirmedTransactionTable } from "./UnconfirmedTransactionTable";

let transactions: DTO.ExtendedConfirmedTransactionData[];
let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;

describe("Unconfirmed transaction table", () => {
	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();

		//@ts-ignore
		transactions = [
			{
				convertedTotal: () => BigNumber.ZERO,
				isConfirmed: () => false,
				isMultiPayment: () => false,
				isSent: () => true,
				isTransfer: () => true,
				isUnvote: () => false,
				isVote: () => false,
				recipient: () => "D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
				recipients: () => ["D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb", wallet.address()],
				timestamp: () => DateTime.make(),
				total: () => BigNumber.make(1),
				type: () => "transfer",
				wallet: () => wallet,
			},
			{
				convertedTotal: () => BigNumber.ZERO,
				isConfirmed: () => false,
				isMultiPayment: () => true,
				isSent: () => true,
				isTransfer: () => false,
				isUnvote: () => false,
				isVote: () => false,
				recipient: () => "D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
				recipients: () => ["D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb", wallet.address()],
				timestamp: () => DateTime.make(),
				total: () => BigNumber.make(1),
				type: () => "multiPayment",
				wallet: () => wallet,
			},
		];
	});

	it("should render", () => {
		const { asFragment } = render(<UnconfirmedTransactionTable transactions={transactions} profile={profile} />);

		expect(asFragment()).toMatchSnapshot();
	});
});
