import { Contracts, DTO } from "@payvo/sdk-profiles";
import { waitFor } from "@testing-library/react";
import nock from "nock";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, screen } from "utils/testing-library";

import { Notifications } from "./Notifications";

const NotificationTransactionsFixtures = require("tests/fixtures/coins/ark/devnet/notification-transactions.json");
const TransactionsFixture = require("tests/fixtures/coins/ark/devnet/transactions.json");

let profile: Contracts.IProfile;

describe("Notifications", () => {
	beforeEach(async () => {
		nock("https://ark-test.payvo.com/api").get("/transactions").query(true).reply(200, {
			data: NotificationTransactionsFixtures.data,
			meta: TransactionsFixture.meta,
		});

		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		profile
			.notifications()
			.releases()
			.push({
				meta: { version: "3.0.0" },
				name: "Wallet update",
			});

		await profile.notifications().transactions().sync();
	});

	it("should render with plugins", async () => {
		const { container } = render(<Notifications profile={profile} />);
		await waitFor(() => expect(screen.queryAllByTestId("TransactionRowMode")).not.toHaveLength(0));

		expect(container).toMatchSnapshot();
	});

	it("should render with transactions and plugins", async () => {
		const { container } = render(<Notifications profile={profile} />);

		await waitFor(() => expect(screen.getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(screen.queryAllByTestId("TransactionRowMode")).toHaveLength(3));

		expect(container).toMatchSnapshot();
	});

	it("should emit onNotificationAction event", async () => {
		const onNotificationAction = jest.fn();

		render(<Notifications profile={profile} onNotificationAction={onNotificationAction} />);
		await waitFor(() => expect(screen.getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(screen.queryAllByTestId("TransactionRowMode")).toHaveLength(3));

		fireEvent.click(screen.getAllByTestId("NotificationItem__action")[1]);

		await waitFor(() => expect(onNotificationAction).toHaveBeenCalledWith(expect.any(String)));
	});

	it("should emit transactionClick event", async () => {
		const onTransactionClick = jest.fn();

		const { container } = render(<Notifications profile={profile} onTransactionClick={onTransactionClick} />);

		await waitFor(() => expect(screen.getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(screen.queryAllByTestId("TransactionRowMode")).toHaveLength(3));

		fireEvent.click(screen.getAllByTestId("TransactionRowMode")[0]);

		await waitFor(() =>
			expect(onTransactionClick).toHaveBeenCalledWith(expect.any(DTO.ExtendedConfirmedTransactionData)),
		);

		expect(container).toMatchSnapshot();
	});

	it("should render with empty notifications", async () => {
		const emptyProfile = env.profiles().create("test2");

		const { container } = render(<Notifications profile={emptyProfile} />);
		await waitFor(() => expect(screen.queryAllByTestId("TransactionRowMode")).toHaveLength(0));

		expect(container).toMatchSnapshot();
	});
});
