import { Contracts, DTO } from "@payvo/sdk-profiles";
import nock from "nock";
import React from "react";
import {
	env,
	fireEvent,
	getDefaultProfileId,
	getDefaultWalletId,
	render,
	screen,
	waitFor,
} from "utils/testing-library";

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
		render(<NotificationTransactionsTable transactions={transactions} profile={profile} isLoading={false} />);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(transactions.length);
	});

	it("should render loading state", () => {
		render(<NotificationTransactionsTable transactions={transactions} profile={profile} />);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(10);
	});

	it("should emit on visibility change event", async () => {
		const onVisibilityChange = jest.fn();
		render(
			<NotificationTransactionsTable
				transactions={transactions}
				profile={profile}
				isLoading={false}
				onVisibilityChange={onVisibilityChange}
			/>,
		);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(transactions.length);

		await waitFor(() => expect(onVisibilityChange).toHaveBeenCalledWith(false));
	});

	it("should emit on click event", async () => {
		const onClick = jest.fn();
		render(
			<NotificationTransactionsTable
				transactions={transactions}
				profile={profile}
				isLoading={false}
				onClick={onClick}
			/>,
		);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(transactions.length);

		fireEvent.click(screen.getAllByTestId("TableRow")[0]);

		await waitFor(() => expect(onClick).toHaveBeenCalledWith(expect.any(DTO.ExtendedConfirmedTransactionData)));
	});
});
