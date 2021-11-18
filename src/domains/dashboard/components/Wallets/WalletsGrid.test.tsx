import { Contracts } from "@payvo/sdk-profiles";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render, screen, waitFor } from "utils/testing-library";

import { GridWallet } from "./Wallets.contracts";
import { WalletsGrid } from "./WalletsGrid";

let profile: Contracts.IProfile;
let wallets: GridWallet[];

const history = createMemoryHistory();
const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;

describe("WalletsGrid", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());

		wallets = profile
			.wallets()
			.values()
			.map((wallet) => ({ actions: [], wallet: wallet }));
	});

	beforeEach(() => {
		history.push(dashboardURL);
	});

	it("should not render if visible prop is falsy", () => {
		render(<WalletsGrid wallets={[]} isVisible={false} />);

		expect(() => screen.getByTestId("WalletsGrid")).toThrow(/Unable to find an element by/);
	});

	it("should render loading state", async () => {
		render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletsGrid wallets={wallets} isVisible={true} isLoading={true} />,
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() => expect(screen.getAllByTestId("WalletCard__skeleton")).toHaveLength(3));
	});

	it("should render wallets", async () => {
		render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletsGrid wallets={wallets} isVisible={true} />,
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(screen.getByTestId("WalletsGrid")).toBeInTheDocument();

		await waitFor(() => expect(screen.getAllByTestId("Card")).toHaveLength(2));
	});
});
