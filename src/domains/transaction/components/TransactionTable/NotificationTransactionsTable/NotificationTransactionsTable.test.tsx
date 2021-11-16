import { Contracts, DTO } from "@payvo/profiles";
import userEvent from "@testing-library/user-event";
import nock from "nock";
import React from "react";
import { env, getDefaultProfileId, getDefaultWalletId, render, waitFor } from "utils/testing-library";

import { NotificationTransactionsTable } from "./NotificationTransactionsTable";

describe("NotificationsTransactionTable", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;
	let transactions: DTO.ExtendedConfirmedTransactionData[];

	beforeAll(() => {
		nock("https://ark-test.payvo.com/api")
			.get("/transactions")
			.query(true)
			.reply(200, require("tests/fixtures/coins/ark/devnet/transactions.json"));
	});

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById(getDefaultWalletId());

		const allTransactions = await wallet.transactionIndex().all();
		transactions = allTransactions.items();
	});

	it("should render", () => {
		const { getAllByTestId } = render(
			<NotificationTransactionsTable transactions={transactions} profile={profile} isLoading={false} />,
		);

		expect(getAllByTestId("TableRow")).toHaveLength(transactions.length);
	});

	it("should render loading state", () => {
		const { getAllByTestId } = render(
			<NotificationTransactionsTable transactions={transactions} profile={profile} />,
		);

		expect(getAllByTestId("TableRow")).toHaveLength(10);
	});

	it("should emit on visibility change event", async () => {
		const onVisibilityChange = jest.fn();
		const { getAllByTestId } = render(
			<NotificationTransactionsTable
				transactions={transactions}
				profile={profile}
				isLoading={false}
				onVisibilityChange={onVisibilityChange}
			/>,
		);

		expect(getAllByTestId("TableRow")).toHaveLength(transactions.length);

		await waitFor(() => expect(onVisibilityChange).toHaveBeenCalledWith(false));
	});

	it("should emit on click event", async () => {
		const onClick = jest.fn();
		const { getAllByTestId } = render(
			<NotificationTransactionsTable
				transactions={transactions}
				profile={profile}
				isLoading={false}
				onClick={onClick}
			/>,
		);

		expect(getAllByTestId("TableRow")).toHaveLength(transactions.length);

		userEvent.click(getAllByTestId("TableRow")[0]);

		await waitFor(() => expect(onClick).toHaveBeenCalledWith(expect.any(DTO.ExtendedConfirmedTransactionData)));
	});
});
