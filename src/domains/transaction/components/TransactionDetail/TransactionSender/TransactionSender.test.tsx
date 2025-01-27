import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { TransactionSender } from "./TransactionSender";

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;

describe("TransactionSender", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().values()[0];
	});

	it("should render", () => {
		const { container } = render(
			<Route path="/profiles/:profileId">
				<TransactionSender address={wallet.address()} network={wallet.network()} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(container).toHaveTextContent(wallet.address());
		expect(container).toMatchSnapshot();
	});

	it("should render with address", () => {
		const { container } = render(
			<Route path="/profiles/:profileId">
				<TransactionSender address="test-address" />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(container).toHaveTextContent("test-address");
		expect(container).toMatchSnapshot();
	});

	it("should render with alias", () => {
		const { container } = render(
			<Route path="/profiles/:profileId">
				<TransactionSender address={wallet.address()} network={wallet.network()} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(container).toHaveTextContent(wallet.address());
		expect(container).toHaveTextContent("ARK Wallet 1");
		expect(container).toMatchSnapshot();
	});

	it("should not render delegate icon", () => {
		const delegateMock = jest.spyOn(env.delegates(), "findByAddress").mockReturnValue({
			username: () => "delegate username",
		} as any);

		const { container } = render(
			<Route path="/profiles/:profileId">
				<TransactionSender address={wallet.address()} network={wallet.network()} />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(container).toHaveTextContent(wallet.address());
		expect(container).toHaveTextContent("delegate-registration.svg");
		expect(container).toMatchSnapshot();

		delegateMock.mockRestore();
	});
});
