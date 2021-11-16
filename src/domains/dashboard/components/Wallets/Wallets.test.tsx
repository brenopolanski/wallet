import { Contracts } from "@payvo/profiles";
import { LSK } from "@payvo/sdk-lsk";
import userEvent from "@testing-library/user-event";
import { LedgerProvider } from "app/contexts/Ledger/Ledger";
import * as useRandomNumberHook from "app/hooks/use-random-number";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { translations as dashboardTranslations } from "domains/dashboard/i18n";
import { translations as walletTranslations } from "domains/wallet/i18n";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import {
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	render,
	screen,
	syncDelegates,
	waitFor,
	within,
} from "utils/testing-library";

import { Wallets } from "./Wallets";

const history = createMemoryHistory();
const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;

let profile: Contracts.IProfile;
let emptyProfile: Contracts.IProfile;
let wallets: Contracts.IReadWriteWallet[];

describe("Wallets", () => {
	beforeAll(async () => {
		jest.spyOn(useRandomNumberHook, "useRandomNumber").mockImplementation(() => 1);

		nock("https://neoscan.io/api/main_net/v1/")
			.get("/get_last_transactions_by_address/AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX/1")
			.reply(200, []);

		emptyProfile = env.profiles().create("Empty");
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		const wallet = await profile.walletFactory().fromAddress({
			address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
			coin: "ARK",
			network: "ark.mainnet",
		});

		profile.wallets().push(wallet);

		wallets = profile.wallets().values();

		await syncDelegates(profile);
	});

	beforeEach(() => {
		history.push(dashboardURL);
	});

	afterAll(() => {
		useRandomNumberHook.useRandomNumber.mockRestore();
	});

	it("should render grid", () => {
		const { asFragment, getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(getByTestId("WalletsGrid")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render grid in loading state", () => {
		const { asFragment, getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets isLoading={true} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(getByTestId("WalletsGrid")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render list", async () => {
		const { asFragment, getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const toggle = getByTestId("LayoutControls__list--icon");
		userEvent.click(toggle);

		await findByTestId("WalletsList");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle between grid and list view", async () => {
		const { asFragment, getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		userEvent.click(getByTestId("LayoutControls__list--icon"));

		await findByTestId("WalletsList");

		userEvent.click(getByTestId("LayoutControls__grid--icon"));

		await findByTestId("WalletsGrid");

		expect(getByTestId("WalletsGrid")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render without testnet wallets", () => {
		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, false);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(asFragment()).toMatchSnapshot();

		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, true);
	});

	it("should load more wallets", async () => {
		const { asFragment, getByTestId, getAllByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets listPagerLimit={1} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const toggle = getByTestId("LayoutControls__list--icon");
		userEvent.click(toggle);

		await findByTestId("WalletsList");
		await findByTestId("WalletsList__ViewMore");

		userEvent.click(getByTestId("WalletsList__ViewMore"));

		await waitFor(() => expect(getAllByTestId("TableRow")).toHaveLength(3));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle wallet creation", () => {
		const onCreateWallet = jest.fn();
		const { getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets onCreateWallet={onCreateWallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		userEvent.click(getByTestId("WalletControls__create-wallet"));

		expect(onCreateWallet).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should handle wallet import", () => {
		const onImportWallet = jest.fn();
		const { getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets onImportWallet={onImportWallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		userEvent.click(getByTestId("WalletControls__import-wallet"));

		expect(onImportWallet).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should handle filter change", async () => {
		const { getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		userEvent.click(getByTestId("dropdown__toggle"));
		userEvent.click(getByTestId("filter-wallets__wallets"));
		userEvent.click(getByTestId("dropdown__option--1"));

		await waitFor(() =>
			expect(getByTestId("filter-wallets__wallets")).toHaveTextContent(commonTranslations.STARRED),
		);

		userEvent.click(getByTestId("filter-wallets__wallets"));
		userEvent.click(getByTestId("dropdown__option--0"));

		await waitFor(() => expect(getByTestId("filter-wallets__wallets")).toHaveTextContent(commonTranslations.ALL));
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

		const route = `/profiles/${profile.id()}/dashboard`;
		const history = createMemoryHistory();
		history.push(route);

		render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [route],
			},
		);

		userEvent.click(within(screen.getByTestId("WalletControls")).getByTestId("dropdown__toggle"));

		expect(screen.getByTestId("NetworkOptions")).toBeInTheDocument();
		expect(screen.getByTestId("NetworkOptions").firstChild).toHaveTextContent("ark.svg");
	});

	it("should open and close ledger import modal", async () => {
		const transport = getDefaultLedgerTransport();
		const unsubscribe = jest.fn();
		const listenSpy = jest.spyOn(transport, "listen").mockImplementationOnce(() => ({ unsubscribe }));

		const { asFragment, getByTestId, getByText, queryByText, findByText } = render(
			<Route path="/profiles/:profileId/dashboard">
				<LedgerProvider transport={transport}>
					<Wallets />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		userEvent.click(getByText(dashboardTranslations.WALLET_CONTROLS.IMPORT_LEDGER));

		await findByText(walletTranslations.MODAL_LEDGER_WALLET.CONNECT_DEVICE);

		userEvent.click(getByTestId("modal__close-btn"));

		await waitFor(() =>
			expect(queryByText(walletTranslations.MODAL_LEDGER_WALLET.CONNECT_DEVICE)).not.toBeInTheDocument(),
		);

		userEvent.click(getByText(dashboardTranslations.WALLET_CONTROLS.IMPORT_LEDGER));

		await findByText(walletTranslations.MODAL_LEDGER_WALLET.CONNECT_DEVICE);

		expect(asFragment()).toMatchSnapshot();

		listenSpy.mockReset();
	});

	it("should handle list wallet click", () => {
		const { getByTestId, getByText } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const toggle = getByTestId("LayoutControls__list--icon");

		userEvent.click(toggle);
		userEvent.click(getByText(wallets[0].alias()!));

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/wallets/${wallets[0].id()}`);
	});

	it("should rename wallet through wallet card dropdown", async () => {
		render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const name = "New Name";

		userEvent.click(screen.getByTestId("LayoutControls__grid--icon"));

		await waitFor(() => {
			expect(screen.getByTestId("WalletsGrid")).toBeInTheDocument();
		});

		expect(() => within(screen.getAllByTestId("Card")[0]).getByText(name)).toThrow(/Unable to find an element/);

		userEvent.click(within(screen.getAllByTestId("Card")[0]).getByTestId("dropdown__toggle"));

		expect(screen.getByTestId("dropdown__content")).toBeInTheDocument();
		expect(screen.getByText(commonTranslations.RENAME)).toBeInTheDocument();

		userEvent.click(screen.getByText(commonTranslations.RENAME));

		await screen.findByTestId("modal__inner");

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(walletTranslations.MODAL_NAME_WALLET.TITLE);

		fireEvent.input(screen.getByTestId("UpdateWalletName__input"), { target: { value: name } });

		await waitFor(() => expect(screen.getByTestId("UpdateWalletName__input")).toHaveValue(name));

		expect(screen.getByTestId("UpdateWalletName__submit")).not.toBeDisabled();

		userEvent.click(screen.getByTestId("UpdateWalletName__submit"));

		await waitFor(() => expect(profile.wallets().first().alias()).toBe(name));

		expect(within(screen.getAllByTestId("Card")[0]).getByText(name)).toBeInTheDocument();
	});

	it("should delete wallet through wallet card dropdown", async () => {
		render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		const count = profile.wallets().count();

		userEvent.click(screen.getByTestId("LayoutControls__grid--icon"));

		await waitFor(() => {
			expect(screen.getByTestId("WalletsGrid")).toBeInTheDocument();
		});

		userEvent.click(within(screen.getAllByTestId("Card")[0]).getByTestId("dropdown__toggle"));

		expect(screen.getByTestId("dropdown__content")).toBeInTheDocument();
		expect(screen.getByText(commonTranslations.DELETE)).toBeInTheDocument();

		userEvent.click(screen.getByText(commonTranslations.DELETE));

		await screen.findByTestId("modal__inner");

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(walletTranslations.MODAL_DELETE_WALLET.TITLE);

		userEvent.click(screen.getByTestId("DeleteResource__submit-button"));

		await waitFor(() => expect(profile.wallets().count()).toBe(count - 1));
	});

	it("should render empty profile wallets", async () => {
		history.push(`/profiles/${emptyProfile.id()}/dashboard`);

		const { asFragment, getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Wallets />
			</Route>,
			{
				history,
				routes: [`/profiles/${emptyProfile.id()}/dashboard`],
			},
		);

		const toggle = getByTestId("LayoutControls__list--icon");
		userEvent.click(toggle);

		await findByTestId("WalletsList");

		expect(asFragment()).toMatchSnapshot();
	});
});
