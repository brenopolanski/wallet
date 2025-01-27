import { sortByDesc } from "@payvo/sdk-helpers";
import { Contracts, DTO } from "@payvo/sdk-profiles";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as useRandomNumberHook from "app/hooks/use-random-number";
import nock from "nock";
import React from "react";
import { env, getDefaultProfileId, getDefaultWalletId, render, waitFor } from "utils/testing-library";

import { TransactionTable } from "./TransactionTable";

describe("TransactionTable", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;
	let transactions: DTO.ExtendedConfirmedTransactionData[];

	beforeAll(() => {
		nock("https://ark-test.payvo.com/api")
			.get("/transactions")
			.query(true)
			.reply(
				200,
				require("tests/fixtures/coins/ark/devnet/transactions/byAddress/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD-1-10.json"),
			);
	});

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById(getDefaultWalletId());

		const allTransactions = await wallet.transactionIndex().all();
		transactions = allTransactions.items();
	});

	it("should render", () => {
		const { asFragment } = render(<TransactionTable transactions={transactions} profile={profile} />);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(transactions.length);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with currency", () => {
		render(<TransactionTable transactions={transactions} exchangeCurrency="BTC" profile={profile} />);

		expect(screen.getAllByTestId("TransactionRow__currency")).toHaveLength(transactions.length);
	});

	it("should render compact", () => {
		const { asFragment } = render(<TransactionTable transactions={transactions} profile={profile} isCompact />);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(transactions.length);
		expect(asFragment()).toMatchSnapshot();
	});

	describe("loading state", () => {
		let useRandomNumberSpy: jest.SpyInstance;

		beforeAll(() => {
			useRandomNumberSpy = jest.spyOn(useRandomNumberHook, "useRandomNumber").mockImplementation(() => 1);
		});

		afterAll(() => {
			useRandomNumberSpy.mockRestore();
		});

		it("should render", () => {
			const { asFragment } = render(
				<TransactionTable transactions={[]} isLoading skeletonRowsLimit={5} profile={profile} />,
			);

			expect(screen.getAllByTestId("TableRow")).toHaveLength(5);
			expect(asFragment()).toMatchSnapshot();
		});

		it("should render with currency column", () => {
			const { asFragment } = render(
				<TransactionTable
					transactions={[]}
					isLoading
					exchangeCurrency="BTC"
					skeletonRowsLimit={5}
					profile={profile}
				/>,
			);

			expect(screen.getAllByTestId("TableRow")).toHaveLength(5);
			expect(asFragment()).toMatchSnapshot();
		});

		it("should render compact", () => {
			const { asFragment } = render(
				<TransactionTable transactions={[]} isLoading isCompact skeletonRowsLimit={5} profile={profile} />,
			);

			expect(screen.getAllByTestId("TableRow")).toHaveLength(5);
			expect(asFragment()).toMatchSnapshot();
		});
	});

	it("should emit action on the row click", () => {
		const onClick = jest.fn();
		const sortedByDateDesc = sortByDesc(transactions, (transaction) => transaction.timestamp());

		render(<TransactionTable transactions={sortedByDateDesc} onRowClick={onClick} profile={profile} />);

		userEvent.click(screen.getAllByTestId("TableRow")[0]);

		expect(onClick).toHaveBeenCalledWith(sortedByDateDesc[0]);
	});

	it("should emit action on the compact row click", async () => {
		const onClick = jest.fn();

		render(<TransactionTable transactions={transactions} onRowClick={onClick} isCompact profile={profile} />);

		userEvent.click(screen.getAllByTestId("TableRow")[0]);

		await waitFor(() => expect(onClick).toHaveBeenCalledWith(transactions[1]));
	});
});
