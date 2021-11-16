import { Contracts } from "@payvo/profiles";
import userEvent from "@testing-library/user-event";
import * as useRandomNumberHook from "app/hooks/use-random-number";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render, screen } from "utils/testing-library";

import { WalletCard } from "./WalletCard";

const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;
const history = createMemoryHistory();

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;

describe("Wallet Card", () => {
	beforeAll(() => {
		jest.spyOn(useRandomNumberHook, "useRandomNumber").mockImplementation(() => 1);
	});

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		wallet.data().set(Contracts.WalletFlag.Starred, true);
		wallet.data().set(Contracts.WalletData.DerivationPath, "0");

		await wallet.synchroniser().identity();
		jest.spyOn(wallet, "isMultiSignature").mockReturnValue(true);

		history.push(dashboardURL);
	});

	afterAll(() => {
		useRandomNumberHook.useRandomNumber.mockRestore();
	});

	it("should render", () => {
		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toMatchSnapshot();
	});

	it("should render loading state", () => {
		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard isLoading={true} wallet={wallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(screen.getByTestId("WalletCard__skeleton")).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});

	it("should render blank", () => {
		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toMatchSnapshot();
	});

	it("should render blank with starred display type", () => {
		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard displayType="starred" />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toHaveTextContent("star-filled.svg");
		expect(container).toMatchSnapshot();
	});

	it("should render blank with ledger display type", () => {
		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard displayType="ledger" />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toHaveTextContent("ledger.svg");
		expect(container).toMatchSnapshot();
	});

	it("should render with wallet data", () => {
		wallet.settings().set(Contracts.WalletSetting.Alias, "My wallet");

		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} />,
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toMatchSnapshot();
	});

	it("should render with wallet data and optional icon", () => {
		wallet.settings().set(Contracts.WalletSetting.Alias, "My wallet");

		const { container } = render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(container).toMatchSnapshot();
	});

	it("should click a wallet and redirect to it when fully restored", () => {
		render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/dashboard`);

		userEvent.click(screen.getByText("D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD"));

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/wallets/${wallet.id()}`);
	});

	it("should not redirect to wallet when not fully restored", () => {
		const hasBeenFullyRestored = jest.spyOn(wallet, "hasBeenFullyRestored").mockReturnValue(false);

		render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/dashboard`);

		userEvent.click(screen.getByText(wallet.alias()!));

		expect(history.location.pathname).not.toBe(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		hasBeenFullyRestored.mockRestore();
	});

	it("should execute onWalletAction callback", () => {
		const onWalletAction = jest.fn();
		const actions = [{ label: "Option", value: "option" }];

		render(
			<Route path="/profiles/:profileId/dashboard">
				<WalletCard wallet={wallet} actions={actions} onWalletAction={onWalletAction} />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		expect(history.location.pathname).toBe(`/profiles/${profile.id()}/dashboard`);

		userEvent.click(screen.getByTestId("dropdown__toggle"));

		expect(screen.getByTestId("dropdown__content")).toBeInTheDocument();
		expect(screen.getByTestId("dropdown__option--0")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("dropdown__option--0"));

		expect(onWalletAction).toHaveBeenCalledWith(actions[0].value, wallet);
	});
});
