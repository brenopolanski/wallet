import { Contracts } from "@payvo/sdk-profiles";
import { translations } from "domains/dashboard/i18n";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render, screen } from "utils/testing-library";

import { GridWallet } from "./Wallets.contracts";
import { WalletsList } from "./WalletsList";

const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;
const history = createMemoryHistory();

let profile: Contracts.IProfile;
let wallets: GridWallet[];

describe("WalletsList", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());

		wallets = profile
			.wallets()
			.values()
			.map((wallet) => ({ actions: [], wallet: wallet }));

		history.push(dashboardURL);
	});

	it("should render", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletsList wallets={wallets} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(screen.getByTestId("WalletsList")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render if isVisible is false", () => {
		const { asFragment } = render(<WalletsList wallets={wallets} isVisible={false} />);

		expect(() => screen.getByTestId("WalletsList")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with view more button", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletsList wallets={wallets} hasMore={true} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(screen.getByTestId("WalletsList")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render empty block", () => {
		const { asFragment } = render(<WalletsList wallets={[]} />);

		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();
		expect(screen.getByTestId("EmptyBlock")).toHaveTextContent(translations.WALLET_CONTROLS.EMPTY_MESSAGE);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render empty block for starred display type", () => {
		const { asFragment } = render(<WalletsList wallets={[]} walletsDisplayType="starred" />);

		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();
		expect(screen.getByTestId("EmptyBlock")).toHaveTextContent(
			translations.WALLET_CONTROLS.EMPTY_MESSAGE_TYPE.replace("<bold>{{type}}</bold>", "Starred"),
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render empty block for ledger display type", () => {
		const { asFragment } = render(<WalletsList wallets={[]} walletsDisplayType="ledger" />);

		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();
		expect(screen.getByTestId("EmptyBlock")).toHaveTextContent(
			translations.WALLET_CONTROLS.EMPTY_MESSAGE_TYPE.replace("<bold>{{type}}</bold>", "Ledger"),
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render loading state", () => {
		const { asFragment } = render(<WalletsList wallets={[]} isLoading={true} />);

		expect(screen.getAllByTestId("TableRow")).toHaveLength(3);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show proper message when no wallets match the filters", () => {
		const { rerender } = render(
			<WalletsList wallets={[]} walletsDisplayType="all" hasWalletsMatchingOtherNetworks={true} />,
		);

		expect(screen.getByTestId("EmptyBlock")).toHaveTextContent(translations.WALLET_CONTROLS.EMPTY_MESSAGE_FILTERED);

		rerender(<WalletsList wallets={[]} walletsDisplayType="starred" hasWalletsMatchingOtherNetworks={true} />);

		expect(screen.getByTestId("EmptyBlock")).toHaveTextContent(
			translations.WALLET_CONTROLS.EMPTY_MESSAGE_TYPE_FILTERED.replace("<bold>{{type}}</bold>", "Starred"),
		);

		rerender(<WalletsList wallets={[]} walletsDisplayType="ledger" hasWalletsMatchingOtherNetworks={true} />);

		expect(screen.getByTestId("EmptyBlock")).toHaveTextContent(
			translations.WALLET_CONTROLS.EMPTY_MESSAGE_TYPE_FILTERED.replace("<bold>{{type}}</bold>", "Ledger"),
		);
	});
});
