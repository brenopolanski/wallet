/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
import { ProfileSetting } from "@payvo/profiles/distribution/contracts";
import { ReadOnlyWallet } from "@payvo/profiles/distribution/read-only-wallet";
import { useProfileStatusWatcher } from "app/hooks";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import {
	act,
	env,
	fireEvent,
	getDefaultProfileId,
	renderWithRouter,
	screen,
	syncDelegates,
	waitFor,
	within,
} from "utils/testing-library";

import { Votes } from "./Votes";

const history = createMemoryHistory();

let emptyProfile: Contracts.IProfile;
let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
let blankWallet: Contracts.IReadWriteWallet;

const blankWalletPassphrase = "power return attend drink piece found tragic fire liar page disease combine";

const renderPage = (route: string, routePath = "/profiles/:profileId/wallets/:walletId/votes", hasHistory = false) => {
	let routeOptions: any = {
		routes: [route],
	};

	if (hasHistory) {
		history.push(route);

		routeOptions = {
			...routeOptions,
			history,
		};
	}

	return renderWithRouter(
		<Route path={routePath}>
			<Votes />
		</Route>,
		routeOptions,
	);
};

describe("Votes", () => {
	beforeAll(async () => {
		nock("https://neoscan.io/api/main_net/v1/")
			.get("/get_last_transactions_by_address/AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX/1")
			.reply(200, []);

		emptyProfile = env.profiles().findById("cba050f1-880f-45f0-9af9-cfe48f406052");
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		blankWallet = profile.wallets().push(
			await profile.walletFactory().fromMnemonicWithBIP39({
				coin: "ARK",
				mnemonic: blankWalletPassphrase,
				network: "ark.devnet",
			}),
		);

		wallet.settings().set(Contracts.WalletSetting.Alias, "Sample Wallet");

		nock.disableNetConnect();

		nock("https://ark-test.payvo.com")
			.get("/api/delegates")
			.query({ page: "1" })
			.reply(200, require("tests/fixtures/coins/ark/devnet/delegates.json"))
			.get(`/api/wallets/${blankWallet.address()}`)
			.reply(404, {
				error: "Not Found",
				message: "Wallet not found",
				statusCode: 404,
			})
			.persist();

		await env.profiles().restore(profile);
		await syncDelegates(profile);
		await wallet.synchroniser().votes();
	});

	it("should render", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment, container, getByTestId } = renderPage(route);

		expect(container).toBeTruthy();
		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("DelegateRow__toggle-0")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render and handle wallet current voting exception", async () => {
		const currentWallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		const currentMock = jest.spyOn(currentWallet.voting(), "current").mockImplementation(() => {
			throw new Error("Error");
		});

		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment, container, getByTestId } = renderPage(route);

		expect(container).toBeTruthy();
		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("DelegateRow__toggle-0")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();

		currentMock.mockRestore();
	});

	it("should render with no wallets", () => {
		const route = `/profiles/${emptyProfile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container, getByTestId } = renderPage(route, routePath);

		expect(container).toBeTruthy();
		expect(getByTestId("EmptyBlock")).toBeTruthy();
		expect(() => getByTestId("HeaderSearchBar__button")).toThrow(/Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle network selection from network filters", async () => {
		await profile.sync();

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container, getByTestId } = renderPage(route, routePath);

		expect(container).toBeTruthy();
		expect(getByTestId("AddressTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("AddressRow__select-0")).toBeTruthy());

		act(() => {
			fireEvent.click(within(getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));
		});

		const toggle = getByTestId("NetworkOption__ark.devnet");

		await waitFor(() => expect(toggle).toBeTruthy());
		fireEvent.click(toggle);

		expect(() => getByTestId("AddressTable")).toThrow(/Unable to find an element by/);

		await waitFor(() => expect(toggle).toBeTruthy());
		fireEvent.click(toggle);

		await waitFor(() => expect(getByTestId("AddressTable")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select starred option in the wallets display type", async () => {
		await profile.sync();

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container, getByTestId } = renderPage(route, routePath);

		expect(container).toBeTruthy();
		expect(getByTestId("AddressTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("AddressRow__select-0")).toBeTruthy());

		act(() => {
			fireEvent.click(within(getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));
		});

		await waitFor(() => expect(within(getByTestId("FilterWallets")).getByTestId("dropdown__toggle")).toBeTruthy());

		const toggle = within(getByTestId("FilterWallets")).getByTestId("dropdown__toggle");
		fireEvent.click(toggle);

		await waitFor(() => expect(getByTestId("filter-wallets__wallets")).toBeTruthy());

		await waitFor(() => expect(getByTestId("dropdown__option--1")).toBeTruthy());

		fireEvent.click(getByTestId("dropdown__option--1"));

		expect(() => getByTestId("AddressTable")).toThrow(/Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select ledger option in the wallets display type", async () => {
		await profile.sync();

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container, getByTestId } = renderPage(route, routePath);

		expect(container).toBeTruthy();
		expect(getByTestId("AddressTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("AddressRow__select-0")).toBeTruthy());

		act(() => {
			fireEvent.click(within(getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));
		});

		await waitFor(() => expect(within(getByTestId("FilterWallets")).getByTestId("dropdown__toggle")).toBeTruthy());

		const toggle = within(getByTestId("FilterWallets")).getByTestId("dropdown__toggle");
		fireEvent.click(toggle);

		await waitFor(() => expect(getByTestId("filter-wallets__wallets")).toBeTruthy());

		await waitFor(() => expect(getByTestId("dropdown__option--2")).toBeTruthy());

		fireEvent.click(getByTestId("dropdown__option--2"));

		expect(() => getByTestId("AddressTable")).toThrow(/Unable to find an element by/);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should filter current delegates", async () => {
		const currentWallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		jest.spyOn(currentWallet.voting(), "current").mockReturnValue([
			{
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: "D5L5zXgvqtg7qoGimt5vYhFuf5Ued6iWVr",
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: false,
					publicKey: currentWallet.publicKey(),
					rank: 52,
					username: "arkx",
				}),
			},
		]);

		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment, container, getByTestId, getAllByTestId } = renderPage(route);

		expect(container).toBeTruthy();
		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("DelegateRow__toggle-0")).toBeTruthy());

		act(() => {
			fireEvent.click(within(getByTestId("VotesFilter")).getByTestId("dropdown__toggle"));
		});

		await waitFor(() => expect(within(getByTestId("VotesFilter")).getByTestId("dropdown__content")).toBeTruthy());

		act(() => {
			fireEvent.click(getByTestId("VotesFilter__option--current"));
		});

		await waitFor(() => expect(getAllByTestId("DelegateRow__toggle-0")).toHaveLength(1));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to create create page", () => {
		const route = `/profiles/${emptyProfile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, getByTestId, getByRole } = renderPage(route, routePath, true);

		expect(getByTestId("EmptyBlock")).toBeTruthy();

		act(() => {
			fireEvent.click(getByRole("button", { name: /Create/ }));
		});

		expect(history.location.pathname).toEqual(`/profiles/${emptyProfile.id()}/wallets/create`);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to import wallet page", () => {
		const route = `/profiles/${emptyProfile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, getByTestId, getByRole } = renderPage(route, routePath, true);

		expect(getByTestId("EmptyBlock")).toBeTruthy();

		act(() => {
			fireEvent.click(getByRole("button", { name: /Import/ }));
		});

		expect(history.location.pathname).toEqual(`/profiles/${emptyProfile.id()}/wallets/import`);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should select an address and delegate", async () => {
		const currentWallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		jest.spyOn(currentWallet.voting(), "current").mockReturnValue([
			{
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: "D5L5zXgvqtg7qoGimt5vYhFuf5Ued6iWVr",
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: false,
					publicKey: currentWallet.publicKey(),
					rank: 52,
					username: "arkx",
				}),
			},
		]);

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, getByTestId } = renderPage(route, routePath);

		expect(getByTestId("AddressTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("StatusIcon__icon")).toBeTruthy());

		const selectAddressButton = getByTestId("AddressRow__select-0");

		act(() => {
			fireEvent.click(selectAddressButton);
		});

		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => {
			expect(getByTestId("DelegateRow__toggle-0")).toBeTruthy();
		});

		const selectDelegateButton = getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(getByTestId("DelegateTable__footer")).toBeTruthy();

		act(() => {
			fireEvent.click(getByTestId("DelegateTable__continue-button"));
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select an address without vote", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, getByTestId } = renderPage(route, routePath);

		expect(getByTestId("AddressTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("StatusIcon__icon")).toBeTruthy());

		const selectAddressButton = getByTestId("AddressRow__select-1");

		act(() => {
			fireEvent.click(selectAddressButton);
		});

		await waitFor(() => expect(getByTestId("DelegateTable")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select a delegate", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment, getByTestId } = renderPage(route);

		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => {
			expect(getByTestId("DelegateRow__toggle-0")).toBeTruthy();
		});

		const selectDelegateButton = getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(getByTestId("DelegateTable__footer--votecombination")).toHaveTextContent("1/1");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle wallet vote error and show empty delegates", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;

		const walletVoteMock = jest.spyOn(wallet.voting(), "current").mockImplementation(() => {
			throw new Error("delegate error");
		});

		const { getByTestId } = renderPage(route);

		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => {
			expect(getByTestId("DelegateRow__toggle-0")).toBeTruthy();
		});

		const selectDelegateButton = getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(getByTestId("DelegateTable__footer--votecombination")).toHaveTextContent("1/1");

		walletVoteMock.mockRestore();
	});

	it("should trigger network connection warning", async () => {
		const currentWallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		const route = `/profiles/${profile.id()}/wallets/${currentWallet.id()}/votes`;

		const history = createMemoryHistory();
		history.push(route);

		const onProfileSyncError = jest.fn();
		const Component = () => {
			useProfileStatusWatcher({ env, onProfileSyncError, profile });
			return <Votes />;
		};
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/votes">
				<Component />
			</Route>,
			{
				history,
				routes: [route],
				withProfileSynchronizer: true,
			},
		);

		await waitFor(() => expect(screen.getByTestId("DelegateTable")).toBeTruthy());

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeTruthy();
		});

		const selectDelegateButton = screen.getByTestId("DelegateRow__toggle-0");

		const syncMock = jest.spyOn(profile, "sync").mockImplementationOnce(() => {
			throw new Error("error syncing");
		});
		const walletRestoreMock = jest.spyOn(profile.wallets().first(), "hasSyncedWithNetwork").mockReturnValue(false);

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeTruthy();
		expect(screen.getByTestId("DelegateTable__footer--votecombination")).toHaveTextContent("1/1");

		await waitFor(() => expect(onProfileSyncError).toHaveBeenCalled());

		expect(asFragment()).toMatchSnapshot();

		syncMock.mockRestore();
		walletRestoreMock.mockRestore();
	});

	it("should emit action on continue button", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment, getByTestId } = renderPage(route);

		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => {
			expect(getByTestId("DelegateRow__toggle-0")).toBeTruthy();
		});

		const selectDelegateButton = getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(getByTestId("DelegateTable__footer")).toBeTruthy();

		act(() => {
			fireEvent.click(getByTestId("DelegateTable__continue-button"));
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit action on continue button to unvote/vote", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, getByTestId } = renderPage(route, routePath);

		expect(getByTestId("AddressTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("StatusIcon__icon")).toBeTruthy());

		const selectAddressButton = getByTestId("AddressRow__select-1");

		act(() => {
			fireEvent.click(selectAddressButton);
		});

		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => {
			expect(getByTestId("DelegateRow__toggle-0")).toBeTruthy();
		});

		const selectUnvoteButton = getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectUnvoteButton);
		});

		expect(getByTestId("DelegateTable__footer")).toBeTruthy();

		const selectVoteButton = getByTestId("DelegateRow__toggle-1");

		act(() => {
			fireEvent.click(selectVoteButton);
		});

		expect(getByTestId("DelegateTable__footer")).toBeTruthy();

		act(() => {
			fireEvent.click(getByTestId("DelegateTable__continue-button"));
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should hide testnet wallet if disabled from profile setting", async () => {
		profile.settings().set(ProfileSetting.UseTestNetworks, false);

		const mainnetWallet = await profile.walletFactory().fromAddress({
			address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
			coin: "ARK",
			network: "ark.mainnet",
		});

		profile.wallets().push(mainnetWallet);

		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment, container, getByTestId } = renderPage(route);

		expect(container).toBeTruthy();
		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("DelegateRow__toggle-0")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();

		profile.settings().set(ProfileSetting.UseTestNetworks, true);

		// cleanup
		profile.wallets().forget(mainnetWallet.id());
	});

	it("should filter wallets by address", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { getByTestId, queryAllByTestId } = renderPage(route, routePath);

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(3));

		act(() => {
			fireEvent.click(within(getByTestId("HeaderSearchBar")).getByRole("button"));
		});

		await waitFor(() => expect(getByTestId("HeaderSearchBar__input")).toBeInTheDocument());
		const searchInput = within(getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		act(() => {
			fireEvent.change(searchInput, { target: { value: "D8rr7B1d6TL6pf1" } });
		});

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(1));
	});

	it("should filter wallets by alias", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { getByTestId, queryAllByTestId } = renderPage(route, routePath);

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(3));

		act(() => {
			fireEvent.click(within(getByTestId("HeaderSearchBar")).getByRole("button"));
		});

		await waitFor(() => expect(getByTestId("HeaderSearchBar__input")).toBeInTheDocument());
		const searchInput = within(getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		act(() => {
			fireEvent.change(searchInput, { target: { value: "ARK Wallet 2" } });
		});

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(1));
	});

	it("should reset wallet search", async () => {
		profile.settings().set(ProfileSetting.UseTestNetworks, true);

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { getByTestId, queryAllByTestId } = renderPage(route, routePath);

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(3));

		act(() => {
			fireEvent.click(within(getByTestId("HeaderSearchBar")).getByRole("button"));
		});

		await waitFor(() => expect(getByTestId("HeaderSearchBar__input")).toBeInTheDocument());
		const searchInput = within(getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		// Search by wallet alias
		act(() => {
			fireEvent.change(searchInput, { target: { value: "non existent wallet name" } });
		});

		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(0));

		// Reset search
		act(() => {
			fireEvent.click(getByTestId("header-search-bar__reset"));
		});

		await waitFor(() => expect(searchInput).toHaveValue(""));
		await waitFor(() => expect(queryAllByTestId("TableRow")).toHaveLength(3));
	});

	it("should show resigned delegate notice", async () => {
		const currentWallet = profile.wallets().first();
		const walletSpy = jest.spyOn(currentWallet.voting(), "current").mockReturnValue([
			{
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: "D5L5zXgvqtg7qoGimt5vYhFuf5Ued6iWVr",
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: true,
					publicKey: currentWallet.publicKey(),
					rank: 52,
					username: "arkx",
				}),
			},
		]);
		const route = `/profiles/${profile.id()}/wallets/${currentWallet.id()}/votes`;
		const { container, getByTestId } = renderPage(route);

		expect(getByTestId("DelegateTable")).toBeTruthy();

		await waitFor(() => expect(getByTestId("Votes__resigned-vote")).toBeInTheDocument());

		expect(container).toMatchSnapshot();

		walletSpy.mockRestore();
	});
});
