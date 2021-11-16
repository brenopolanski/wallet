import userEvent from "@testing-library/user-event";
import { Contracts } from "@payvo/profiles";
import { ExchangeProvider } from "domains/exchange/contexts/Exchange";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, screen, within } from "utils/testing-library";

import { ExchangeTransactionsTable } from "./ExchangeTransactionsTable";

let profile: Contracts.IProfile;

let dateNowSpy: jest.SpyInstance;

const stubData = {
	input: {
		address: "inputAddress",
		amount: 1,
		ticker: "btc",
	},
	output: {
		address: "outputAddress",
		amount: 100,
		ticker: "ark",
	},
	provider: "changenow",
};

describe("ExchangeTransactionsTable", () => {
	beforeAll(() => {
		dateNowSpy = jest.spyOn(Date, "now").mockImplementation(() => new Date("2021-01-01").getTime());

		profile = env.profiles().findById(getDefaultProfileId());

		profile.exchangeTransactions().create({ ...stubData, orderId: "1" });
		profile.exchangeTransactions().create({ ...stubData, orderId: "2" });
		profile.exchangeTransactions().create({ ...stubData, orderId: "3" });
	});

	afterAll(() => {
		dateNowSpy.mockRestore();
	});

	it("should render", () => {
		const { container } = render(
			<ExchangeProvider>
				<ExchangeTransactionsTable
					exchangeTransactions={profile.exchangeTransactions().values()}
					onClick={jest.fn()}
					onRemove={jest.fn()}
				/>
			</ExchangeProvider>,
		);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(profile.exchangeTransactions().count());

		expect(container).toMatchSnapshot();
	});

	it("should render compact", () => {
		const { container } = render(
			<ExchangeProvider>
				<ExchangeTransactionsTable
					exchangeTransactions={profile.exchangeTransactions().values()}
					onClick={jest.fn()}
					onRemove={jest.fn()}
					isCompact
				/>
			</ExchangeProvider>,
		);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(profile.exchangeTransactions().count());

		expect(container).toMatchSnapshot();
	});

	it("should execute onClick callback", () => {
		const onClick = jest.fn();

		render(
			<ExchangeProvider>
				<ExchangeTransactionsTable
					exchangeTransactions={profile.exchangeTransactions().values()}
					onClick={onClick}
					onRemove={jest.fn()}
				/>
			</ExchangeProvider>,
		);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(profile.exchangeTransactions().count());

		userEvent.click(within(screen.getAllByTestId("TableRow")[0]).getAllByRole("button")[0]);

		// reverse() is called because display items are sorted by creation date desc.
		const exchangeTransaction = profile.exchangeTransactions().values().reverse()[0];

		expect(onClick).toHaveBeenCalledWith(exchangeTransaction.provider(), exchangeTransaction.orderId());
	});

	it("should execute onRemove callback", () => {
		const onRemove = jest.fn();

		render(
			<ExchangeProvider>
				<ExchangeTransactionsTable
					exchangeTransactions={profile.exchangeTransactions().values()}
					onClick={jest.fn()}
					onRemove={onRemove}
				/>
			</ExchangeProvider>,
		);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(profile.exchangeTransactions().count());

		userEvent.click(within(screen.getAllByTestId("TableRow")[0]).getAllByRole("button")[1]);

		expect(onRemove).toHaveBeenCalledWith(profile.exchangeTransactions().values()[0]);
	});
});
