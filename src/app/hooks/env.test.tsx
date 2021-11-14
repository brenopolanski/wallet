import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { useActiveProfile, useActiveWallet, useNetworks } from "./env";

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;

describe("useActiveProfile", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().values()[0];
	});

	const TestProfile: React.FC = () => {
		const profile = useActiveProfile();

		return <h1>{profile.name()}</h1>;
	};

	const TestWallet: React.FC = () => {
		const wallet = useActiveWallet();

		return <h1>{wallet.address()}</h1>;
	};

	it("should return profile", () => {
		const { getByText } = render(
			<Route path="/profiles/:profileId">
				<TestProfile />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(getByText(profile.name())).toBeInTheDocument();
	});

	it("should throw error when profile is not found", () => {
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

		expect(() => {
			render(
				<Route path="/profiles/:profileId">
					<TestProfile />
				</Route>,
				{
					routes: [`/profiles/any_undefined_profile`],
				},
			);
		}).toThrow("No profile found for [any_undefined_profile]");

		consoleErrorSpy.mockRestore();
	});

	it("should throw error when useActiveProfile is called on a route where profile is not available", () => {
		const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
		const history = createMemoryHistory({ initialEntries: ["/route-without-profile"] });

		expect(() => {
			render(<TestProfile />, {
				history,
				routes: ["/route-without-profile"],
			});
		}).toThrow(
			"Parameter [profileId] must be available on the route where [useActiveProfile] is called. Current route is [/route-without-profile].",
		);

		consoleErrorSpy.mockRestore();
	});

	it("should return wallet", () => {
		const { getByText } = render(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<TestWallet />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/wallets/${wallet.id()}`],
			},
		);

		expect(getByText(wallet.address())).toBeInTheDocument();
	});

	it("should throw error with no profile", () => {
		expect(() =>
			render(
				<Route path="/profiles/:profileId/wallets/:walletId">
					<TestWallet />
				</Route>,
				{
					routes: [`/profiles/${"undefined"}/wallets/${wallet.id()}`],
				},
			),
		).toThrow("No profile found for [undefined].");
	});

	it("should throw error with no wallet", () => {
		expect(() =>
			render(
				<Route path="/profiles/:profileId/wallets/:walletId">
					<TestWallet />
				</Route>,
				{
					routes: [`/profiles/${profile.id()}/wallets/${"undefined"}`],
				},
			),
		).toThrow("Cannot read property 'address' of undefined");
	});
});

let networks: Networks.Network[];
let wallets: Contracts.IReadWriteWallet[];

describe("useNetworks", () => {
	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallets = profile.wallets().values();
		networks = wallets
			.map((wallet) => wallet.network())
			.sort((a, b) => a.displayName().localeCompare(b.displayName()));
	});

	const TestNetworks = () => {
		const networks = useNetworks();
		return (
			<ul>
				{networks.map((network) => (
					<li key={network.id()}>{network.displayName()}</li>
				))}
			</ul>
		);
	};

	it("should return networks", () => {
		const { getByText } = render(
			<Route path="/profiles/:profileId">
				<TestNetworks />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		networks.map((network) => expect(getByText(network.displayName())).toBeInTheDocument());
	});

	it("should throw the error when no profile", () => {
		expect(() =>
			render(
				<Route path="">
					<TestNetworks />
				</Route>,
			),
		).toThrow(
			`Parameter [profileId] must be available on the route where [useActiveProfile] is called. Current route is [/].`,
		);
	});
});
