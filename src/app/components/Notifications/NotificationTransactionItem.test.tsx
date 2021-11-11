import { Contracts, DTO } from "@payvo/profiles";
import { httpClient } from "app/services";
import nock from "nock";
import React from "react";
import { TransactionFixture } from "tests/fixtures/transactions";
import { env, fireEvent, getDefaultProfileId, render, waitFor } from "utils/testing-library";

import { NotificationTransactionItem } from "./NotificationTransactionItem";
const NotificationTransactionsFixtures = require("tests/fixtures/coins/ark/devnet/notification-transactions.json");
const TransactionsFixture = require("tests/fixtures/coins/ark/devnet/transactions.json");

let profile: Contracts.IProfile;
let notificationTransaction: DTO.ExtendedConfirmedTransactionData;

describe("Notifications", () => {
	beforeEach(async () => {
		httpClient.clearCache();

		nock("https://ark-test.payvo.com").get("/api/transactions").query(true).reply(200, {
			data: NotificationTransactionsFixtures.data,
			meta: TransactionsFixture.meta,
		});

		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();
		await profile.notifications().transactions().sync();
		notificationTransaction = profile.notifications().transactions().transaction(TransactionFixture.id());
	});

	it("should render notification item", async () => {
		const { container, getAllByTestId } = render(
			<table>
				<tbody>
					<NotificationTransactionItem transaction={notificationTransaction!} profile={profile} />
				</tbody>
			</table>,
		);
		await waitFor(() => expect(getAllByTestId("TransactionRowMode")).toHaveLength(1));

		expect(container).toMatchSnapshot();
	});

	it("should emit onVisibilityChange event", async () => {
		const onVisibilityChange = jest.fn();

		const { getAllByTestId } = render(
			<table>
				<tbody>
					<NotificationTransactionItem
						transaction={notificationTransaction!}
						profile={profile}
						onVisibilityChange={onVisibilityChange}
					/>
				</tbody>
			</table>,
		);
		await waitFor(() => expect(getAllByTestId("TransactionRowMode")).toHaveLength(1));
		await waitFor(() => expect(onVisibilityChange).toHaveBeenCalledWith(expect.any(Boolean)));
	});

	it("should emit events onTransactionClick", async () => {
		const onTransactionClick = jest.fn();

		const { getAllByTestId, getByTestId } = render(
			<table>
				<tbody>
					<NotificationTransactionItem
						transaction={notificationTransaction!}
						profile={profile}
						onTransactionClick={onTransactionClick}
					/>
				</tbody>
			</table>,
		);
		await waitFor(() => expect(getAllByTestId("TransactionRowMode")).toHaveLength(1));

		fireEvent.click(getByTestId("TransactionRowMode"));

		await waitFor(() => expect(onTransactionClick).toHaveBeenCalledWith(notificationTransaction));
	});
});
