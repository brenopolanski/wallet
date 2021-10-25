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
		const { asFragment, container } = renderPage(route);

		expect(container).toBeTruthy();
		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render and handle wallet current voting exception", async () => {
		const currentWallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		const currentMock = jest.spyOn(currentWallet.voting(), "current").mockImplementation(() => {
			throw new Error("Error");
		});

		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment, container } = renderPage(route);

		expect(container).toBeTruthy();
		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();

		currentMock.mockRestore();
	});

	it("should render with no wallets", () => {
		const route = `/profiles/${emptyProfile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container } = renderPage(route, routePath);

		expect(container).toBeTruthy();
		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();
		expect(screen.queryByTestId("HeaderSearchBar__button")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle network selection from network filters", async () => {
		await profile.sync();

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container } = renderPage(route, routePath);

		expect(container).toBeTruthy();
		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("AddressRow__select-0")).toBeInTheDocument());

		act(() => {
			fireEvent.click(within(screen.getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));
		});

		const toggle = screen.getByTestId("NetworkOption__ark.devnet");

		await waitFor(() => expect(toggle).toBeInTheDocument());
		fireEvent.click(toggle);

		expect(screen.queryByTestId("AddressTable")).not.toBeInTheDocument();

		await waitFor(() => expect(toggle).toBeInTheDocument());
		fireEvent.click(toggle);

		await waitFor(() => expect(screen.getByTestId("AddressTable")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select starred option in the wallets display type", async () => {
		await profile.sync();

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container } = renderPage(route, routePath);

		expect(container).toBeTruthy();
		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("AddressRow__select-0")).toBeInTheDocument());

		act(() => {
			fireEvent.click(within(screen.getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));
		});

		await waitFor(() =>
			expect(within(screen.getByTestId("FilterWallets")).getByTestId("dropdown__toggle")).toBeInTheDocument(),
		);

		const toggle = within(screen.getByTestId("FilterWallets")).getByTestId("dropdown__toggle");
		fireEvent.click(toggle);

		await waitFor(() => expect(screen.getByTestId("filter-wallets__wallets")).toBeInTheDocument());

		await waitFor(() => expect(screen.getByTestId("dropdown__option--1")).toBeInTheDocument());

		fireEvent.click(screen.getByTestId("dropdown__option--1"));

		expect(screen.queryByTestId("AddressTable")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select ledger option in the wallets display type", async () => {
		await profile.sync();

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container } = renderPage(route, routePath);

		expect(container).toBeTruthy();
		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("AddressRow__select-0")).toBeInTheDocument());

		act(() => {
			fireEvent.click(within(screen.getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));
		});

		await waitFor(() =>
			expect(within(screen.getByTestId("FilterWallets")).getByTestId("dropdown__toggle")).toBeInTheDocument(),
		);

		const toggle = within(screen.getByTestId("FilterWallets")).getByTestId("dropdown__toggle");
		fireEvent.click(toggle);

		await waitFor(() => expect(screen.getByTestId("filter-wallets__wallets")).toBeInTheDocument());

		await waitFor(() => expect(screen.getByTestId("dropdown__option--2")).toBeInTheDocument());

		fireEvent.click(screen.getByTestId("dropdown__option--2"));

		expect(screen.queryByTestId("AddressTable")).not.toBeInTheDocument();

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
		const { asFragment, container } = renderPage(route);

		expect(container).toBeTruthy();
		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument());

		act(() => {
			fireEvent.click(within(screen.getByTestId("VotesFilter")).getByTestId("dropdown__toggle"));
		});

		await waitFor(() =>
			expect(within(screen.getByTestId("VotesFilter")).getByTestId("dropdown__content")).toBeInTheDocument(),
		);

		act(() => {
			fireEvent.click(screen.getByTestId("VotesFilter__option--current"));
		});

		await waitFor(() => expect(screen.getAllByTestId("DelegateRow__toggle-0")).toHaveLength(1));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to create create page", () => {
		const route = `/profiles/${emptyProfile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment } = renderPage(route, routePath, true);

		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();

		act(() => {
			fireEvent.click(screen.getByRole("button", { name: /Create/ }));
		});

		expect(history.location.pathname).toEqual(`/profiles/${emptyProfile.id()}/wallets/create`);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to import wallet page", () => {
		const route = `/profiles/${emptyProfile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment } = renderPage(route, routePath, true);

		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();

		act(() => {
			fireEvent.click(screen.getByRole("button", { name: /Import/ }));
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
		const { asFragment } = renderPage(route, routePath);

		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("StatusIcon__icon")).toBeInTheDocument());

		const selectAddressButton = screen.getByTestId("AddressRow__select-0");

		act(() => {
			fireEvent.click(selectAddressButton);
		});

		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument();
		});

		const selectDelegateButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();

		act(() => {
			fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select an address without vote", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment } = renderPage(route, routePath);

		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("StatusIcon__icon")).toBeInTheDocument());

		const selectAddressButton = screen.getByTestId("AddressRow__select-1");

		act(() => {
			fireEvent.click(selectAddressButton);
		});

		await waitFor(() => expect(screen.getByTestId("DelegateTable")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select a delegate", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment } = renderPage(route);

		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument();
		});

		const selectDelegateButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();
		expect(screen.getByTestId("DelegateTable__footer--votecombination")).toHaveTextContent("1/1");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle wallet vote error and show empty delegates", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;

		const walletVoteMock = jest.spyOn(wallet.voting(), "current").mockImplementation(() => {
			throw new Error("delegate error");
		});

		renderPage(route);

		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument();
		});

		const selectDelegateButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();
		expect(screen.getByTestId("DelegateTable__footer--votecombination")).toHaveTextContent("1/1");

		walletVoteMock.mockRestore();
	});

	it("should handle resigned delegate and show empty results", async () => {
		const currentWallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		jest.spyOn(currentWallet.voting(), "current").mockReturnValue([
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

		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		renderPage(route);

		await waitFor(() => expect(screen.getByTestId("DelegateTable")).toBeInTheDocument());

		await waitFor(() => expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument());

		act(() => {
			fireEvent.click(within(screen.getByTestId("VotesFilter")).getByTestId("dropdown__toggle"));
		});

		await waitFor(() =>
			expect(within(screen.getByTestId("VotesFilter")).getByTestId("dropdown__content")).not.toBeDisabled(),
		);

		act(() => {
			fireEvent.click(screen.getByTestId("VotesFilter__option--current"));
		});

		await waitFor(() => expect(screen.getByTestId("EmptyResults")).toBeInTheDocument());
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

		await waitFor(() => expect(screen.getByTestId("DelegateTable")).toBeInTheDocument());

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument();
		});

		const selectDelegateButton = screen.getByTestId("DelegateRow__toggle-0");

		const syncMock = jest.spyOn(profile, "sync").mockImplementationOnce(() => {
			throw new Error("error syncing");
		});
		const walletRestoreMock = jest.spyOn(profile.wallets().first(), "hasSyncedWithNetwork").mockReturnValue(false);

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();
		expect(screen.getByTestId("DelegateTable__footer--votecombination")).toHaveTextContent("1/1");

		await waitFor(() => expect(onProfileSyncError).toHaveBeenCalled());

		expect(asFragment()).toMatchSnapshot();

		syncMock.mockRestore();
		walletRestoreMock.mockRestore();
	});

	it("should emit action on continue button", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment } = renderPage(route);

		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument();
		});

		const selectDelegateButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectDelegateButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();

		act(() => {
			fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));
		});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit action on continue button to unvote/vote", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment } = renderPage(route, routePath);

		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("StatusIcon__icon")).toBeInTheDocument());

		const selectAddressButton = screen.getByTestId("AddressRow__select-1");

		act(() => {
			fireEvent.click(selectAddressButton);
		});

		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument();
		});

		const selectUnvoteButton = screen.getByTestId("DelegateRow__toggle-0");

		act(() => {
			fireEvent.click(selectUnvoteButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();

		const selectVoteButton = screen.getByTestId("DelegateRow__toggle-1");

		act(() => {
			fireEvent.click(selectVoteButton);
		});

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();

		act(() => {
			fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));
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
		const { asFragment, container } = renderPage(route);

		expect(container).toBeTruthy();
		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument());

		expect(asFragment()).toMatchSnapshot();

		profile.settings().set(ProfileSetting.UseTestNetworks, true);

		// cleanup
		profile.wallets().forget(mainnetWallet.id());
	});

	it("should filter wallets by address", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		renderPage(route, routePath);

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));

		act(() => {
			fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));
		});

		await waitFor(() => expect(screen.getByTestId("HeaderSearchBar__input")).toBeInTheDocument());
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		act(() => {
			fireEvent.change(searchInput, { target: { value: "D8rr7B1d6TL6pf1" } });
		});

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
	});

	it("should filter wallets by alias", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		renderPage(route, routePath);

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));

		act(() => {
			fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));
		});

		await waitFor(() => expect(screen.getByTestId("HeaderSearchBar__input")).toBeInTheDocument());
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		act(() => {
			fireEvent.change(searchInput, { target: { value: "ARK Wallet 2" } });
		});

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
	});

	it("should reset wallet search", async () => {
		profile.settings().set(ProfileSetting.UseTestNetworks, true);

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		renderPage(route, routePath);

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));

		act(() => {
			fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));
		});

		await waitFor(() => expect(screen.getByTestId("HeaderSearchBar__input")).toBeInTheDocument());
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		// Search by wallet alias
		act(() => {
			fireEvent.change(searchInput, { target: { value: "non existent wallet name" } });
		});

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(0));

		// Reset search
		act(() => {
			fireEvent.click(screen.getByTestId("header-search-bar__reset"));
		});

		await waitFor(() => expect(searchInput).toHaveValue(""));
		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));
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
		const { container } = renderPage(route);

		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => expect(screen.getByTestId("Votes__resigned-vote")).toBeInTheDocument());

		expect(container).toMatchSnapshot();

		walletSpy.mockRestore();
	});

	it("should filter delegates by address", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		renderPage(route);

		await waitFor(() => expect(screen.getByTestId("DelegateTable")).toBeInTheDocument());
		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));

		act(() => {
			fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));
		});

		await waitFor(() => expect(screen.getByTestId("HeaderSearchBar__input")).toBeInTheDocument());
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		act(() => {
			fireEvent.change(searchInput, { target: { value: "DBk4cPYpqp7EBc" } });
		});

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
	});

	it("should filter delegates by alias", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		renderPage(route);

		await waitFor(() => expect(screen.getByTestId("DelegateTable")).toBeInTheDocument());
		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));

		act(() => {
			fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));
		});

		await waitFor(() => expect(screen.getByTestId("HeaderSearchBar__input")).toBeInTheDocument());
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		act(() => {
			fireEvent.change(searchInput, { target: { value: "itsanametoo" } });
		});

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
	});
});
