/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import userEvent from "@testing-library/user-event";
import { translations } from "domains/wallet/i18n";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { act, env, fireEvent, getDefaultProfileId, render, screen, waitFor, within } from "utils/testing-library";

import { SearchWallet } from "./SearchWallet";

const history = createMemoryHistory();
const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;
let wallets: Contracts.IReadWriteWallet[];
let profile: Contracts.IProfile;

describe.each([true, false])("SearchWallet uses fiat value = %s", (showConvertedValue) => {
	beforeAll(() => {
		history.push(dashboardURL);
	});

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());

		wallets = profile.wallets().values();
		wallets[0].settings().set(Contracts.WalletSetting.Alias, "Sample Wallet");
	});

	it("should render", async () => {
		const { asFragment, getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<SearchWallet
					profile={profile}
					showConvertedValue={showConvertedValue}
					isOpen={true}
					title={translations.MODAL_SELECT_ACCOUNT.TITLE}
					description={translations.MODAL_SELECT_ACCOUNT.DESCRIPTION}
					wallets={wallets}
					onSelectWallet={() => undefined}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.TITLE),
		);
		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.DESCRIPTION),
		);
		await waitFor(() => expect(asFragment()).toMatchSnapshot());
	});

	it("should render with the default exchange currency enabled from profile settings", async () => {
		const walletWithExchangeCurrencyMock = jest
			.spyOn(wallets[0], "exchangeCurrency")
			.mockReturnValue(undefined as any);
		const { asFragment, getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<SearchWallet
					profile={profile}
					showConvertedValue={showConvertedValue}
					isOpen={true}
					title={translations.MODAL_SELECT_ACCOUNT.TITLE}
					description={translations.MODAL_SELECT_ACCOUNT.DESCRIPTION}
					wallets={wallets}
					onSelectWallet={() => undefined}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.TITLE),
		);
		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.DESCRIPTION),
		);
		await waitFor(() => expect(asFragment()).toMatchSnapshot());

		walletWithExchangeCurrencyMock.mockRestore();
	});

	it("should render with selected address", async () => {
		const onSelectWallet = jest.fn();

		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<SearchWallet
					profile={profile}
					showConvertedValue={showConvertedValue}
					isOpen={true}
					title={translations.MODAL_SELECT_ACCOUNT.TITLE}
					description={translations.MODAL_SELECT_ACCOUNT.DESCRIPTION}
					wallets={wallets}
					onSelectWallet={onSelectWallet}
					selectedAddress="D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD"
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(screen.getByTestId("SearchWalletListItem__selected-0")).toBeInTheDocument();
		expect(screen.getByTestId("SearchWalletListItem__select-1")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("SearchWalletListItem__selected-0"));

		expect(onSelectWallet).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				address: "D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD",
				name: wallets[0].alias(),
				network: expect.any(Networks.Network),
			}),
		);

		userEvent.click(screen.getByTestId("SearchWalletListItem__select-1"));

		expect(onSelectWallet).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				address: wallets[1].address(),
				name: wallets[1].alias(),
				network: expect.any(Networks.Network),
			}),
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle close", () => {
		const onClose = jest.fn();

		const { getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<SearchWallet
					profile={profile}
					isOpen={true}
					onClose={onClose}
					showConvertedValue={showConvertedValue}
					wallets={[]}
					title={"title"}
					onSelectWallet={() => undefined}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		fireEvent.click(getByTestId("modal__close-btn"));

		expect(onClose).toHaveBeenCalled();
	});

	it("should filter wallets by address", async () => {
		jest.useFakeTimers();

		const { getByTestId, queryAllByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<SearchWallet
					profile={profile}
					isOpen={true}
					title={translations.MODAL_SELECT_ACCOUNT.TITLE}
					description={translations.MODAL_SELECT_ACCOUNT.DESCRIPTION}
					wallets={wallets}
					showConvertedValue={showConvertedValue}
					onSelectWallet={() => undefined}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.TITLE),
		);
		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.DESCRIPTION),
		);

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(2));

		fireEvent.click(within(getByTestId("HeaderSearchBar")).getByRole("button"));

		await findByTestId("HeaderSearchBar__input");
		const searchInput = within(getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "D8rr7B1d6TL6pf1" } });

		act(() => {
			jest.advanceTimersByTime(100);
		});

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(1));
		jest.useRealTimers();
	});

	it("should filter wallets by alias", async () => {
		jest.useFakeTimers();

		const { getByTestId, queryAllByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<SearchWallet
					profile={profile}
					isOpen={true}
					title={translations.MODAL_SELECT_ACCOUNT.TITLE}
					description={translations.MODAL_SELECT_ACCOUNT.DESCRIPTION}
					wallets={wallets}
					showConvertedValue={showConvertedValue}
					onSelectWallet={() => undefined}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.TITLE),
		);
		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.DESCRIPTION),
		);

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(2));

		fireEvent.click(within(getByTestId("HeaderSearchBar")).getByRole("button"));

		await findByTestId("HeaderSearchBar__input");
		const searchInput = within(getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "Sample Wallet" } });

		act(() => {
			jest.advanceTimersByTime(100);
		});

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(1));

		jest.useRealTimers();
	});

	it("should reset wallet search", async () => {
		jest.useFakeTimers();

		const { getByTestId, queryAllByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<SearchWallet
					profile={profile}
					isOpen={true}
					title={translations.MODAL_SELECT_ACCOUNT.TITLE}
					description={translations.MODAL_SELECT_ACCOUNT.DESCRIPTION}
					wallets={wallets}
					showConvertedValue={showConvertedValue}
					onSelectWallet={() => undefined}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.TITLE),
		);
		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.DESCRIPTION),
		);

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(2));

		fireEvent.click(within(getByTestId("HeaderSearchBar")).getByRole("button"));

		await findByTestId("HeaderSearchBar__input");
		const searchInput = within(getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		// Search by wallet alias
		fireEvent.change(searchInput, { target: { value: "Sample Wallet" } });

		act(() => {
			jest.advanceTimersByTime(100);
		});

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(1));

		// Reset search
		fireEvent.click(getByTestId("header-search-bar__reset"));

		await waitFor(() => expect(searchInput).not.toHaveValue());
		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(2));

		jest.useRealTimers();
	});

	it("should not find search wallet and show empty results screen", async () => {
		jest.useFakeTimers();

		const { getByTestId, queryAllByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<SearchWallet
					profile={profile}
					isOpen={true}
					title={translations.MODAL_SELECT_ACCOUNT.TITLE}
					description={translations.MODAL_SELECT_ACCOUNT.DESCRIPTION}
					wallets={wallets}
					showConvertedValue={showConvertedValue}
					onSelectWallet={() => undefined}
				/>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.TITLE),
		);
		await waitFor(() =>
			expect(getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SELECT_ACCOUNT.DESCRIPTION),
		);

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(2));

		fireEvent.click(within(getByTestId("HeaderSearchBar")).getByRole("button"));

		await findByTestId("HeaderSearchBar__input");
		const searchInput = within(getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(getByTestId("Input"), {
			target: {
				value: "non existent wallet name",
			},
		});

		act(() => {
			jest.advanceTimersByTime(100);
		});

		await waitFor(() => expect(getByTestId("Input")).toHaveValue("non existent wallet name"));
		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(0));

		await findByTestId("EmptyResults");

		jest.useRealTimers();
	});

	it("should disable the `Select` button if the wallet fulfills the condition", async () => {
		const { getAllByTestId } = render(
			<SearchWallet
				profile={profile}
				isOpen={true}
				title={translations.MODAL_SELECT_ACCOUNT.TITLE}
				description={translations.MODAL_SELECT_ACCOUNT.DESCRIPTION}
				wallets={wallets}
				showConvertedValue={showConvertedValue}
				disableAction={(wallet: Contracts.IReadWriteWallet) => wallet.alias() === "Sample Wallet"}
				onSelectWallet={() => undefined}
			/>,
		);

		await waitFor(() => expect(getAllByTestId("TableRow")).toHaveLength(2));

		expect(getAllByTestId("TableRow")[0]).toHaveTextContent("Sample Wallet");
		expect(within(getAllByTestId("TableRow")[0]).getByRole("button")).toBeDisabled();

		expect(getAllByTestId("TableRow")[1]).not.toHaveTextContent("Sample Wallet");
		expect(within(getAllByTestId("TableRow")[1]).getByRole("button")).not.toBeDisabled();
	});
});
