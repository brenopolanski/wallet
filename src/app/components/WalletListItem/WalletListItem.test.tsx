import userEvent from "@testing-library/user-event";
import { Contracts } from "@payvo/profiles";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, fireEvent, getDefaultProfileId, render } from "utils/testing-library";

import { WalletListItem } from "./WalletListItem";

const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;
const history = createMemoryHistory();

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;

describe("WalletListItem", () => {
	beforeAll(() => {
		history.push(dashboardURL);
	});

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		wallet.data().set(Contracts.WalletFlag.Starred, true);
		wallet.data().set(Contracts.WalletData.DerivationPath, "0");

		await env.profiles().restore(profile);
		await profile.sync();
	});

	it.each([true, false])("should render when isCompact = %s", (isCompact: boolean) => {
		const { container, getByText } = render(
			<table>
				<tbody>
					<Route path="/profiles/:profileId/dashboard">
						<WalletListItem wallet={wallet} isCompact={isCompact} />
					</Route>
				</tbody>
			</table>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(getByText(wallet.alias()!)).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});

	it("should render for selected wallet", () => {
		jest.spyOn(wallet.network(), "isTest").mockReturnValue(false);

		const walletId = "ac38fe6d-4b67-4ef1-85be-17c5f6841129";

		const { asFragment, queryByText } = render(
			<table>
				<tbody>
					<Route path="/profiles/:profileId/dashboard">
						<WalletListItem wallet={wallet} activeWalletId={walletId} />
					</Route>
				</tbody>
			</table>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(asFragment()).toMatchSnapshot();
		expect(queryByText("N/A")).toBeNull();
	});

	it("should render with a N/A for fiat", () => {
		jest.spyOn(wallet.network(), "isTest").mockReturnValue(true);

		const walletId = "ac38fe6d-4b67-4ef1-85be-17c5f6841129";

		const { asFragment, getByText } = render(
			<table>
				<tbody>
					<Route path="/profiles/:profileId/dashboard">
						<WalletListItem wallet={wallet} activeWalletId={walletId} />
					</Route>
				</tbody>
			</table>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(asFragment()).toMatchSnapshot();
		expect(getByText("N/A")).toBeInTheDocument();
	});

	it("should render with default BTC as default exchangeCurrency", () => {
		const mockExchangeCurrency = jest.spyOn(wallet, "exchangeCurrency").mockReturnValue(undefined as any);
		const { container, getByText } = render(
			<table>
				<tbody>
					<Route path="/profiles/:profileId/dashboard">
						<WalletListItem wallet={wallet} />
					</Route>
				</tbody>
			</table>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(getByText(wallet.alias()!)).toBeInTheDocument();

		expect(container).toMatchSnapshot();

		mockExchangeCurrency.mockRestore();
	});

	it("should call onClick when clicked and fully restored", () => {
		const onClick = jest.fn();

		const { getByText } = render(
			<table>
				<tbody>
					<Route path="/profiles/:profileId/dashboard">
						<WalletListItem wallet={wallet} onClick={onClick} />
					</Route>
				</tbody>
			</table>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		userEvent.click(getByText(wallet.alias()!));

		expect(onClick).toHaveBeenCalledWith(wallet.id());
	});

	it("should not call onClick when clicked but not fully restored", () => {
		const hasBeenFullyRestored = jest.spyOn(wallet, "hasBeenFullyRestored").mockReturnValue(false);

		const onClick = jest.fn();

		const { getByText } = render(
			<table>
				<tbody>
					<Route path="/profiles/:profileId/dashboard">
						<WalletListItem wallet={wallet} onClick={onClick} />
					</Route>
				</tbody>
			</table>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		userEvent.click(getByText(wallet.alias()!));

		expect(onClick).not.toHaveBeenCalled();

		hasBeenFullyRestored.mockRestore();
	});
});
