// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/sdk-profiles/distribution/read-only-wallet";
import { translations } from "domains/transaction/i18n";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import { TransactionFixture } from "tests/fixtures/transactions";
import { env, getDefaultProfileId, render, syncDelegates, waitFor } from "utils/testing-library";

import { VoteDetail } from "./VoteDetail";

const history = createMemoryHistory();

const fixtureProfileId = getDefaultProfileId();
let dashboardURL: string;

jest.setTimeout(10_000);

describe("VoteDetail", () => {
	beforeAll(async () => {
		nock.cleanAll();
		nock.disableNetConnect();

		nock("https://ark-test.payvo.com")
			.get("/api/delegates")
			.query({ page: "1" })
			.reply(200, require("tests/fixtures/coins/ark/devnet/delegates.json"))
			.persist();

		const profile = env.profiles().findById(fixtureProfileId);

		await syncDelegates(profile);
	});

	beforeEach(() => {
		dashboardURL = `/profiles/${fixtureProfileId}/dashboard`;
		history.push(dashboardURL);

		jest.spyOn(env.delegates(), "map").mockImplementation((wallet, votes) =>
			votes.map(
				(vote: string, index: number) =>
					// @ts-ignore
					new ReadOnlyWallet({
						address: vote,
						username: `delegate-${index}`,
					}),
			),
		);
	});

	it("should not render if not open", async () => {
		const { asFragment, getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<VoteDetail isOpen={false} transaction={TransactionFixture} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal with votes", async () => {
		const { asFragment, getByTestId, findByText } = render(
			<Route path="/profiles/:profileId/dashboard">
				<VoteDetail
					isOpen={true}
					transaction={{
						...TransactionFixture,
						unvotes: () => [],
						votes: () => ["034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192"],
					}}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_VOTE_DETAIL.TITLE),
		);

		await findByText("Votes (1)");
		await findByText("delegate-0");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal with unvotes", async () => {
		const { asFragment, getByTestId, findByText } = render(
			<Route path="/profiles/:profileId/dashboard">
				<VoteDetail
					isOpen={true}
					transaction={{
						...TransactionFixture,
						unvotes: () => ["034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192"],
						votes: () => [],
					}}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_VOTE_DETAIL.TITLE),
		);

		await findByText("Unvotes (1)");
		await findByText("delegate-0");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal with votes and unvotes", async () => {
		const { asFragment, getByTestId, getAllByText, findByText } = render(
			<Route path="/profiles/:profileId/dashboard">
				<VoteDetail
					isOpen={true}
					transaction={{
						...TransactionFixture,
						unvotes: () => ["034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192"],
						votes: () => ["034151a3ec46b5670a682b0a63394f863587d1bc97483b1b6c70eb58e7f0aed192"],
					}}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_VOTE_DETAIL.TITLE),
		);

		await findByText("Votes (1)");
		await findByText("Unvotes (1)");
		await waitFor(() => expect(getAllByText("delegate-0")).toHaveLength(2));

		expect(asFragment()).toMatchSnapshot();
	});
});
