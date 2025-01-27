import { Contracts } from "@payvo/sdk-profiles";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { useActiveProfile, useActiveWallet, useActiveWalletWhenNeeded } from "./env";

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

	it("should return active wallet from url", () => {
		let activeWalletId: string | undefined;

		const TestActiveWallet = () => {
			const activeWallet = useActiveWalletWhenNeeded(false);
			activeWalletId = activeWallet?.id();

			return <TestWallet />;
		};

		const { getByText } = render(
			<Route path="/profiles/:profileId/wallets/:walletId">
				<TestActiveWallet />
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/wallets/${wallet.id()}`],
			},
		);

		expect(activeWalletId).toStrictEqual(wallet.id());
		expect(getByText(wallet.address())).toBeInTheDocument();
	});

	it("should return undefined if wallet id is not provided in url", () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation(jest.fn());
		let activeWalletId: string | undefined;

		const TestActiveWallet = () => {
			const activeWallet = useActiveWalletWhenNeeded(false);
			activeWalletId = activeWallet?.id();

			return <TestWallet />;
		};

		expect(() =>
			render(
				<Route path="/profiles/:profileId/wallets/:walletId">
					<TestActiveWallet />
				</Route>,
				{
					routes: [`/profiles/${profile.id()}/wallets/1`],
					withProfileSynchronizer: false,
				},
			),
		).toThrow("Failed to find a wallet for [1].");

		expect(activeWalletId).toBeUndefined();

		consoleSpy.mockRestore();
	});

	it("should throw if wallet id is not provided in url", () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation(jest.fn());
		let activeWalletId: string | undefined;

		const TestActiveWallet = () => {
			const activeWallet = useActiveWalletWhenNeeded(true);
			activeWalletId = activeWallet?.id();

			return <TestWallet />;
		};

		expect(() =>
			render(
				<Route path="/profiles/:profileId/wallets/:walletId">
					<TestActiveWallet />
				</Route>,
				{
					routes: [`/profiles/${profile.id()}/wallets/1`],
					withProfileSynchronizer: false,
				},
			),
		).toThrow("Failed to find a wallet for [1].");

		expect(activeWalletId).toBeUndefined();

		consoleSpy.mockRestore();
	});
});
