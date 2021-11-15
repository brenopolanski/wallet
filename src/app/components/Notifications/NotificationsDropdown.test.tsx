import { Contracts } from "@payvo/sdk-profiles";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import { env, fireEvent, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { NotificationsDropdown } from ".";
const NotificationTransactionsFixtures = require("tests/fixtures/coins/ark/devnet/notification-transactions.json");
const TransactionsFixture = require("tests/fixtures/coins/ark/devnet/transactions.json");

const history = createMemoryHistory();
let profile: Contracts.IProfile;

describe("Notifications", () => {
	beforeEach(async () => {
		const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;
		history.push(dashboardURL);

		nock("https://ark-test.payvo.com").get("/api/transactions").query(true).reply(200, {
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

	it("should render with transactions and plugins", async () => {
		const { container } = render(<NotificationsDropdown profile={profile} />);

		fireEvent.click(screen.getAllByRole("button")[0]);

		await waitFor(() => expect(screen.getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(screen.queryAllByTestId("TransactionRowMode")).toHaveLength(3));

		expect(container).toMatchSnapshot();
	});

	it("should open and close transaction details modal", async () => {
		await profile.sync();

		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<NotificationsDropdown profile={profile} />
			</Route>,
			{
				history,
				routes: [`/profiles/${getDefaultProfileId()}/dashboard`],
			},
		);

		fireEvent.click(screen.getAllByRole("button")[0]);

		await waitFor(() => expect(screen.getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(screen.queryAllByTestId("TransactionRowMode")).toHaveLength(3));

		fireEvent.click(screen.getAllByTestId("TransactionRowMode")[0]);

		await screen.findByTestId("modal__inner");

		expect(screen.getAllByTestId("Address__alias")).toHaveLength(2);

		expect(container).toMatchSnapshot();

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		await waitFor(() => expect(screen.queryByTestId("modal__inner")).not.toBeInTheDocument());
	});

	it("should open and close wallet update notification modal", async () => {
		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<NotificationsDropdown profile={profile} />
			</Route>,
			{
				history,
				routes: [`/profiles/${getDefaultProfileId()}/dashboard`],
			},
		);

		fireEvent.click(screen.getAllByRole("button")[0]);

		await waitFor(() => expect(screen.getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(screen.queryAllByTestId("TransactionRowMode")).toHaveLength(3));

		fireEvent.click(screen.getAllByTestId("NotificationItem__action")[0]);

		await screen.findByTestId("WalletUpdate__first-step");

		expect(container).toMatchSnapshot();

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		await waitFor(() => expect(screen.queryByTestId("modal__inner")).not.toBeInTheDocument());

		expect(container).toMatchSnapshot();
	});

	it("should open and cancel wallet update notification modal", async () => {
		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<NotificationsDropdown profile={profile} />
			</Route>,
			{
				history,
				routes: [`/profiles/${getDefaultProfileId()}/dashboard`],
			},
		);

		fireEvent.click(screen.getAllByRole("button")[0]);

		await waitFor(() => expect(screen.getAllByTestId("NotificationItem")).toHaveLength(2));
		await waitFor(() => expect(screen.queryAllByTestId("TransactionRowMode")).toHaveLength(3));

		fireEvent.click(screen.getAllByTestId("NotificationItem__action")[0]);

		await screen.findByTestId("WalletUpdate__first-step");

		expect(container).toMatchSnapshot();

		fireEvent.click(screen.getByTestId("WalletUpdate__cancel-button"));

		await waitFor(() => expect(screen.queryByTestId("modal__inner")).not.toBeInTheDocument());

		expect(container).toMatchSnapshot();
	});
});
