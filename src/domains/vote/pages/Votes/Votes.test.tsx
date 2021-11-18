/* eslint-disable @typescript-eslint/require-await */
import { LSK } from "@payvo/sdk-lsk";
import { Contracts } from "@payvo/sdk-profiles";
import { ProfileSetting } from "@payvo/sdk-profiles/distribution/contracts";
import { ReadOnlyWallet } from "@payvo/sdk-profiles/distribution/read-only-wallet";
import { useProfileStatusWatcher } from "app/hooks";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import {
	env,
	fireEvent,
	getDefaultProfileId,
	render,
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

	return render(
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
		await profile.sync();
	});

	it("should render", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment, container } = renderPage(route);

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await screen.findByTestId("DelegateRow__toggle-0");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render and handle wallet current voting exception", async () => {
		const currentWallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		const currentMock = jest.spyOn(currentWallet.voting(), "current").mockImplementation(() => {
			throw new Error("Error");
		});

		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		const { asFragment, container } = renderPage(route);

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await screen.findByTestId("DelegateRow__toggle-0");

		expect(asFragment()).toMatchSnapshot();

		currentMock.mockRestore();
	});

	it("should render with no wallets", () => {
		const route = `/profiles/${emptyProfile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container } = renderPage(route, routePath);

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();
		expect(screen.queryByTestId("HeaderSearchBar__button")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle network selection from network filters", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container } = renderPage(route, routePath);

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await screen.findByTestId("AddressRow__select-0");

		fireEvent.click(within(screen.getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));

		const toggle = screen.getByTestId("NetworkOption__ark.devnet");

		await waitFor(() => expect(toggle).toBeInTheDocument());
		fireEvent.click(toggle);

		expect(screen.queryByTestId("AddressTable")).not.toBeInTheDocument();

		await waitFor(() => expect(toggle).toBeInTheDocument());
		fireEvent.click(toggle);

		await screen.findByTestId("AddressTable");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render network selection with sorted network filters", async () => {
		env.registerCoin("LSK", LSK);

		const profile = env.profiles().create("test");
		await env.profiles().restore(profile);

		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, true);

		const { wallet: lskWallet } = await profile.walletFactory().generate({
			coin: "LSK",
			network: "lsk.testnet",
		});
		const { wallet: arkWallet } = await profile.walletFactory().generate({
			coin: "ARK",
			network: "ark.devnet",
		});
		profile.wallets().push(lskWallet);
		profile.wallets().push(arkWallet);
		await env.wallets().syncByProfile(profile);

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		renderPage(route, routePath);

		expect(screen.getAllByTestId("AddressTable")).toHaveLength(2);

		fireEvent.click(within(screen.getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));

		expect(screen.getByTestId("NetworkOptions")).toBeInTheDocument();
		expect(screen.getByTestId("NetworkOptions").firstChild).toHaveTextContent("ark.svg");
	});

	it("should select starred option in the wallets display type", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container } = renderPage(route, routePath);

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await screen.findByTestId("AddressRow__select-0");

		fireEvent.click(within(screen.getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));

		await waitFor(() =>
			expect(within(screen.getByTestId("FilterWallets")).getByTestId("dropdown__toggle")).toBeInTheDocument(),
		);

		const toggle = within(screen.getByTestId("FilterWallets")).getByTestId("dropdown__toggle");
		fireEvent.click(toggle);

		await screen.findByTestId("filter-wallets__wallets");

		await screen.findByTestId("dropdown__option--1");

		fireEvent.click(screen.getByTestId("dropdown__option--1"));

		expect(screen.queryByTestId("AddressTable")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select ledger option in the wallets display type", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment, container } = renderPage(route, routePath);

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await screen.findByTestId("AddressRow__select-0");

		fireEvent.click(within(screen.getByTestId("Votes__FilterWallets")).getByTestId("dropdown__toggle"));

		await waitFor(() =>
			expect(within(screen.getByTestId("FilterWallets")).getByTestId("dropdown__toggle")).toBeInTheDocument(),
		);

		const toggle = within(screen.getByTestId("FilterWallets")).getByTestId("dropdown__toggle");
		fireEvent.click(toggle);

		await screen.findByTestId("filter-wallets__wallets");

		await screen.findByTestId("dropdown__option--2");

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

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await screen.findByTestId("DelegateRow__toggle-0");

		fireEvent.click(within(screen.getByTestId("VotesFilter")).getByTestId("dropdown__toggle"));

		await waitFor(() =>
			expect(within(screen.getByTestId("VotesFilter")).getByTestId("dropdown__content")).toBeInTheDocument(),
		);

		fireEvent.click(screen.getByTestId("VotesFilter__option--current"));

		await waitFor(() => expect(screen.getAllByTestId("DelegateRow__toggle-0")).toHaveLength(1));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to create create page", () => {
		const route = `/profiles/${emptyProfile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment } = renderPage(route, routePath, true);

		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Create/ }));

		expect(history.location.pathname).toBe(`/profiles/${emptyProfile.id()}/wallets/create`);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate to import wallet page", () => {
		const route = `/profiles/${emptyProfile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment } = renderPage(route, routePath, true);

		expect(screen.getByTestId("EmptyBlock")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Import/ }));

		expect(history.location.pathname).toBe(`/profiles/${emptyProfile.id()}/wallets/import`);
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

		await screen.findByTestId("StatusIcon__icon");

		const selectAddressButton = screen.getByTestId("AddressRow__select-0");

		fireEvent.click(selectAddressButton);

		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument();
		});

		const selectDelegateButton = screen.getByTestId("DelegateRow__toggle-0");

		fireEvent.click(selectDelegateButton);

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should select an address without vote", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment } = renderPage(route, routePath);

		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await screen.findByTestId("StatusIcon__icon");

		const selectAddressButton = screen.getByTestId("AddressRow__select-1");

		fireEvent.click(selectAddressButton);

		await screen.findByTestId("DelegateTable");

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

		fireEvent.click(selectDelegateButton);

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

		fireEvent.click(selectDelegateButton);

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

		await screen.findByTestId("DelegateTable");

		await screen.findByTestId("DelegateRow__toggle-0");

		fireEvent.click(within(screen.getByTestId("VotesFilter")).getByTestId("dropdown__toggle"));

		await waitFor(() =>
			expect(within(screen.getByTestId("VotesFilter")).getByTestId("dropdown__content")).not.toBeDisabled(),
		);

		fireEvent.click(screen.getByTestId("VotesFilter__option--current"));

		await screen.findByTestId("EmptyResults");
	});

	it("should trigger network connection warning", async () => {
		const currentWallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		const route = `/profiles/${profile.id()}/wallets/${currentWallet.id()}/votes`;

		const walletRestoreMock = jest.spyOn(profile.wallets().first(), "hasSyncedWithNetwork").mockReturnValue(false);

		const history = createMemoryHistory();
		history.push(route);

		const onProfileSyncError = jest.fn();
		const Component = () => {
			useProfileStatusWatcher({ env, onProfileSyncError, profile });
			return (
				<Route path="/profiles/:profileId/wallets/:walletId/votes">
					<Votes />
				</Route>
			);
		};
		const { asFragment } = render(<Component />, {
			history,
			routes: [route],
			withProfileSynchronizer: true,
		});

		await screen.findByTestId("DelegateTable");

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument();
		});

		const selectDelegateButton = screen.getByTestId("DelegateRow__toggle-0");

		fireEvent.click(selectDelegateButton);

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();
		expect(screen.getByTestId("DelegateTable__footer--votecombination")).toHaveTextContent("1/1");

		await waitFor(() =>
			expect(onProfileSyncError).toHaveBeenCalledWith([expect.any(String)], expect.any(Function)),
		);

		expect(asFragment()).toMatchSnapshot();

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

		fireEvent.click(selectDelegateButton);

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit action on continue button to unvote/vote", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		const { asFragment } = renderPage(route, routePath);

		expect(screen.getByTestId("AddressTable")).toBeInTheDocument();

		await screen.findByTestId("StatusIcon__icon");

		const selectAddressButton = screen.getByTestId("AddressRow__select-1");

		fireEvent.click(selectAddressButton);

		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByTestId("DelegateRow__toggle-0")).toBeInTheDocument();
		});

		const selectUnvoteButton = screen.getByTestId("DelegateRow__toggle-0");

		fireEvent.click(selectUnvoteButton);

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();

		const selectVoteButton = screen.getByTestId("DelegateRow__toggle-1");

		fireEvent.click(selectVoteButton);

		expect(screen.getByTestId("DelegateTable__footer")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("DelegateTable__continue-button"));

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

		expect(container).toBeInTheDocument();
		expect(screen.getByTestId("DelegateTable")).toBeInTheDocument();

		await screen.findByTestId("DelegateRow__toggle-0");

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

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await screen.findByTestId("HeaderSearchBar__input");
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "D8rr7B1d6TL6pf1" } });

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
	});

	it("should filter wallets by alias", async () => {
		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		renderPage(route, routePath);

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await screen.findByTestId("HeaderSearchBar__input");
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "ARK Wallet 2" } });

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
	});

	it("should reset wallet search", async () => {
		profile.settings().set(ProfileSetting.UseTestNetworks, true);

		const route = `/profiles/${profile.id()}/votes`;
		const routePath = "/profiles/:profileId/votes";
		renderPage(route, routePath);

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await screen.findByTestId("HeaderSearchBar__input");
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		// Search by wallet alias
		fireEvent.change(searchInput, { target: { value: "non existent wallet name" } });

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(0));

		// Reset search
		fireEvent.click(screen.getByTestId("header-search-bar__reset"));

		await waitFor(() => expect(searchInput).not.toHaveValue());
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

		await screen.findByTestId("Votes__resigned-vote");

		expect(container).toMatchSnapshot();

		walletSpy.mockRestore();
	});

	it("should filter delegates by address", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		renderPage(route);

		await screen.findByTestId("DelegateTable");
		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await screen.findByTestId("HeaderSearchBar__input");
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "DBk4cPYpqp7EBc" } });

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
	});

	it("should filter delegates by alias", async () => {
		const route = `/profiles/${profile.id()}/wallets/${wallet.id()}/votes`;
		renderPage(route);

		await screen.findByTestId("DelegateTable");
		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(3));

		fireEvent.click(within(screen.getByTestId("HeaderSearchBar")).getByRole("button"));

		await screen.findByTestId("HeaderSearchBar__input");
		const searchInput = within(screen.getByTestId("HeaderSearchBar__input")).getByTestId("Input");
		await waitFor(() => expect(searchInput).toBeInTheDocument());

		fireEvent.change(searchInput, { target: { value: "itsanametoo" } });

		await waitFor(() => expect(screen.queryAllByTestId("TableRow")).toHaveLength(1));
	});
});
