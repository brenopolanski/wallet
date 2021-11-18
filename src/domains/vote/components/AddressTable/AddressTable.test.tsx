import { Contracts } from "@payvo/sdk-profiles";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render, screen, syncDelegates, waitFor } from "utils/testing-library";

import { AddressTable } from "./AddressTable";

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;

describe("AddressTable", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");

		nock.disableNetConnect();

		nock("https://ark-test.payvo.com")
			.get("/api/delegates")
			.query({ page: "1" })
			.reply(200, require("tests/fixtures/coins/ark/devnet/delegates.json"))
			.persist();

		await syncDelegates(profile);
		await wallet.synchroniser().votes();
	});

	it("should render", async () => {
		const { asFragment, container } = render(
			<Route path="/profiles/:profileId">
				<AddressTable wallets={[wallet]} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(container).toBeInTheDocument();

		await screen.findByTestId("StatusIcon__icon");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render when the maximum votes is greater than 1", () => {
		const maxVotesMock = jest.spyOn(wallet.network(), "maximumVotesPerWallet").mockReturnValue(10);
		const { asFragment, container } = render(
			<Route path="/profiles/:profileId">
				<AddressTable wallets={[wallet]} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();

		maxVotesMock.mockRestore();
	});

	it("should render with voting delegates and handle exception", async () => {
		const walletVotingMock = jest.spyOn(wallet.voting(), "current").mockImplementation(() => {
			throw new Error("error");
		});

		const { asFragment, container } = render(
			<Route path="/profiles/:profileId">
				<AddressTable wallets={[wallet]} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(container).toBeInTheDocument();

		await waitFor(() => expect(() => screen.getByTestId("StatusIcon__icon")).toThrow(/Unable to find an element by/));

		expect(asFragment()).toMatchSnapshot();

		walletVotingMock.mockRestore();
	});
});
