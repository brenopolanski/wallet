/* eslint-disable @typescript-eslint/require-await */
import { DateTime } from "@payvo/intl";
import { Contracts, DTO } from "@payvo/profiles";
import { LSK } from "@payvo/sdk-lsk";
import { screen } from "@testing-library/react";
import { act as hookAct, renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { LedgerProvider, minVersionList } from "app/contexts";
import { useProfileStatusWatcher } from "app/hooks";
import * as useFeesHook from "app/hooks/use-fees";
import { translations as transactionTranslations } from "domains/transaction/i18n";
import { createMemoryHistory } from "history";
import nock from "nock";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Route, Router } from "react-router-dom";
import transactionFixture from "tests/fixtures/coins/ark/devnet/transactions/transfer.json";
import transactionMultipleFixture from "tests/fixtures/coins/ark/devnet/transactions/transfer-multiple.json";
import {
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	getDefaultWalletId,
	getDefaultWalletMnemonic,
	MNEMONICS,
	RenderResult,
	renderWithForm,
	renderWithRouter,
	syncFees,
	waitFor,
	within,
} from "utils/testing-library";

import { FormStep } from "./FormStep";
import { NetworkStep } from "./NetworkStep";
import { ReviewStep } from "./ReviewStep";
import { SendTransfer } from "./SendTransfer";
import { SummaryStep } from "./SummaryStep";

const passphrase = getDefaultWalletMnemonic();
const fixtureProfileId = getDefaultProfileId();
const fixtureWalletId = getDefaultWalletId();

const createTransactionMultipleMock = (wallet: Contracts.IReadWriteWallet) =>
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => +transactionMultipleFixture.data.amount / 1e8,
		data: () => ({ data: () => transactionMultipleFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${transactionFixture.data.id}`,
		fee: () => +transactionMultipleFixture.data.fee / 1e8,
		id: () => transactionMultipleFixture.data.id,
		isMultiSignatureRegistration: () => false,
		recipient: () => transactionMultipleFixture.data.recipient,
		recipients: () => [
			{
				address: transactionMultipleFixture.data.recipient,
				amount: +transactionMultipleFixture.data.amount / 1e8,
			},
		],
		sender: () => transactionMultipleFixture.data.sender,
		type: () => "multiPayment",
		usesMultiSignature: () => false,
	} as any);

const createTransactionMock = (wallet: Contracts.IReadWriteWallet) =>
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => +transactionFixture.data.amount / 1e8,
		data: () => ({ data: () => transactionFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${transactionFixture.data.id}`,
		fee: () => +transactionFixture.data.fee / 1e8,
		id: () => transactionFixture.data.id,
		isMultiSignatureRegistration: () => false,
		recipient: () => transactionFixture.data.recipient,
		recipients: () => [
			{
				address: transactionFixture.data.recipient,
				amount: +transactionFixture.data.amount / 1e8,
			},
		],
		sender: () => transactionFixture.data.sender,
		type: () => "transfer",
		usesMultiSignature: () => false,
	} as any);

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
let secondWallet: Contracts.IReadWriteWallet;
let getVersionSpy: jest.SpyInstance;

describe("SendTransfer", () => {
	beforeAll(async () => {
		env.registerCoin("LSK", LSK);

		profile = env.profiles().findById("b999d134-7a24-481e-a95d-bc47c543bfc9");

		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().first();
		secondWallet = profile.wallets().last();

		getVersionSpy = jest
			.spyOn(wallet.coin().ledger(), "getVersion")
			.mockResolvedValue(minVersionList[wallet.network().coin()]);

		nock.disableNetConnect();

		nock("https://ark-test.payvo.com")
			.get("/api/transactions?address=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD")
			.reply(200, require("tests/fixtures/coins/ark/devnet/transactions.json"))
			.get("/api/transactions?page=1&limit=20&senderId=D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD")
			.reply(200, { data: [], meta: {} })
			.get("/api/transactions/8f913b6b719e7767d49861c0aec79ced212767645cb793d75d2f1b89abb49877")
			.reply(200, () => require("tests/fixtures/coins/ark/devnet/transactions.json"));

		await syncFees(profile);
	});

	afterAll(() => {
		getVersionSpy.mockRestore();
	});

	it("should render form step", async () => {
		const { asFragment } = renderWithForm(<FormStep deeplinkProps={{}} networks={[]} profile={profile} />, {
			defaultValues: {
				network: wallet.network(),
			},
			registerCallback: ({ register }) => {
				register("network");
				register("fee");
				register("fees");
			},
			withProviders: true,
		});

		expect(screen.getByTestId("SendTransfer__form-step")).toBeTruthy();

		await waitFor(() => expect(screen.getAllByTestId("AmountCrypto")).toHaveLength(3));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render form step without test networks", async () => {
		const useNetworksMock = jest.spyOn(profile.settings(), "get").mockImplementation((setting) => {
			if (setting === Contracts.ProfileSetting.ExchangeCurrency) {
				return "USD";
			}

			return false;
		});

		const { asFragment } = renderWithForm(
			<FormStep deeplinkProps={{}} networks={env.availableNetworks()} profile={profile} />,
			{
				defaultValues: {
					network: wallet.network(),
				},
				registerCallback: ({ register }) => {
					register("network");
					register("fee");
					register("fees");
				},
				withProviders: true,
			},
		);

		expect(screen.getByTestId("SendTransfer__form-step")).toBeTruthy();

		await waitFor(() => expect(screen.getAllByTestId("AmountCrypto")).toHaveLength(3));

		expect(asFragment()).toMatchSnapshot();

		useNetworksMock.mockRestore();
	});

	it("should render network step without test networks", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					network: wallet.network(),
					senderAddress: wallet.address(),
				},
			}),
		);

		const useNetworksMock = jest.spyOn(profile.settings(), "get").mockReturnValue(false);

		let rendered: RenderResult;

		await hookAct(async () => {
			rendered = renderWithRouter(
				<Route path="/profiles/:profileId/send-transfer">
					<FormProvider {...form.current}>
						<NetworkStep networks={env.availableNetworks()} profile={profile} />
					</FormProvider>
				</Route>,
				{
					history,
					routes: [transferURL],
				},
			);
		});

		const { getByTestId, asFragment } = rendered;

		expect(getByTestId("SendTransfer__network-step")).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		useNetworksMock.mockRestore();
	});

	it("should render form step with deeplink values and use them", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const deeplinkProperties: any = {
			amount: "1.2",
			coin: "ark",
			memo: "ARK",
			method: "transfer",
			network: "ark.mainnet",
			recipient: "DNjuJEDQkhrJ7cA9FZ2iVXt5anYiM8Jtc9",
		};

		const Component = () => {
			const form = useForm({
				defaultValues: {
					network: wallet.network(),
					senderAddress: wallet.address(),
				},
			});

			const { register } = form;

			useEffect(() => {
				register("network");
				register("fee");
				register("fees");
				register("inputFeeSettings");
				register("senderAddress");
			}, [register]);

			return (
				<FormProvider {...form}>
					<FormStep networks={[]} profile={profile} deeplinkProps={deeplinkProperties} />
				</FormProvider>
			);
		};

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<Component />
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(screen.getByTestId("SendTransfer__form-step")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render 1st step with custom deeplink values and use them", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const deeplinkProperties: any = {
			amount: "1.2",
			coin: "ark",
			method: "transfer",
			network: "ark.mainnet",
			recipient: "DNjuJEDQkhrJ7cA9FZ2iVXt5anYiM8Jtc9",
		};

		const Component = () => {
			const form = useForm({
				defaultValues: {
					network: wallet.network(),
					senderAddress: wallet.address(),
				},
			});

			const { register } = form;

			useEffect(() => {
				register("network");
				register("fee");
				register("fees");
				register("inputFeeSettings");
				register("senderAddress");
			}, [register]);

			return (
				<FormProvider {...form}>
					<FormStep networks={[]} profile={profile} deeplinkProps={deeplinkProperties} />
				</FormProvider>
			);
		};

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<Component />
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(screen.getByTestId("SendTransfer__form-step")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render review step", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					fee: "1",
					memo: "test memo",
					network: wallet.network(),
					recipients: [
						{
							address: wallet.address(),
							alias: wallet.alias(),
							amount: 1,
						},
					],
					senderAddress: wallet.address(),
				},
			}),
		);

		const { asFragment, container, getByTestId, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<FormProvider {...form.current}>
					<ReviewStep wallet={wallet} />
				</FormProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		expect(getByTestId("SendTransfer__review-step")).toBeTruthy();
		expect(container).toHaveTextContent(wallet.network().name());
		expect(getAllByTestId("Address__alias")).toHaveLength(2);
		expect(container).toHaveTextContent("D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD");
		expect(container).toHaveTextContent("test memo");

		expect(asFragment()).toMatchSnapshot();
	});

	it.each([
		["with memo", "memo"],
		["without memo", undefined],
	])("should render review step with multiple recipients (%s)", async (_, memo) => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					fee: "1",
					memo,
					network: wallet.network(),
					recipients: [
						{
							address: wallet.address(),
							amount: 1,
						},
						{
							address: secondWallet.address(),
							amount: 1,
						},
					],
					senderAddress: wallet.address(),
				},
			}),
		);

		const { asFragment, container, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<FormProvider {...form.current}>
					<ReviewStep wallet={wallet} />
				</FormProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		expect(getByTestId("SendTransfer__review-step")).toBeTruthy();
		expect(container).toHaveTextContent(wallet.network().name());
		expect(container).toHaveTextContent(wallet.address());
		expect(container).toHaveTextContent(secondWallet.address());

		if (memo) {
			expect(container).toHaveTextContent(memo);
		}

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render summary step", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		await wallet.synchroniser().identity();

		const transaction = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.transfer({
					data: {
						amount: "1",
						to: wallet.address(),
					},
					fee: "1",
					nonce: "1",
					signatory: await wallet
						.coin()
						.signatory()
						.multiSignature({
							min: 2,
							publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!],
						}),
				}),
			wallet,
		);

		const { asFragment } = renderWithForm(
			<Router history={history}>
				<Route path="/profiles/:profileId/send-transfer">
					<SummaryStep transaction={transaction} senderWallet={wallet} profile={profile} />
				</Route>
			</Router>,
			{
				defaultValues: {
					network: wallet.network(),
					senderAddress: wallet.address(),
				},
				registerCallback: ({ register }) => {
					register("network");
					register("fee");
					register("fees");
				},
				withProviders: true,
			},
		);

		await waitFor(() => expect(screen.getByTestId("TransactionSuccessful")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render network selection without selected wallet", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__network-step")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render network selection with sorted network", async () => {
		const profile = env.profiles().create("test");
		await env.profiles().restore(profile);

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

		profile.settings().set(Contracts.ProfileSetting.UseTestNetworks, true);

		const transferURL = `/profiles/${profile.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(screen.getByTestId("SendTransfer__network-step")).toBeInTheDocument());

		expect(screen.getAllByTestId("SelectNetwork__NetworkIcon--container")).toHaveLength(2);
		expect(screen.getAllByTestId("SelectNetwork__NetworkIcon--container")[0]).toHaveTextContent("ark.svg");
		expect(screen.getAllByTestId("SelectNetwork__NetworkIcon--container")[1]).toHaveTextContent("lsk.svg");
	});

	it("should render form and use location state", async () => {
		const history = createMemoryHistory();
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${fixtureWalletId}/send-transfer?recipient=DNjuJEDQkhrJ7cA9FZ2iVXt5anYiM8Jtc9&memo=ARK&coin=ark&network=ark.devnet`;
		history.push(transferURL);

		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(screen.getByTestId("SendTransfer__form-step")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render form and use location state without memo", async () => {
		const history = createMemoryHistory();

		const transferURL = `/profiles/${fixtureProfileId}/wallets/${fixtureWalletId}/send-transfer?coin=ark&network=ark.devnet`;
		history.push(transferURL);

		const { getByTestId, asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should trigger network connection warning when selecting unsynced wallet", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const walletMock = jest.spyOn(profile.wallets().first(), "hasSyncedWithNetwork").mockReturnValue(false);
		const onProfileSyncError = jest.fn();
		const Component = () => {
			useProfileStatusWatcher({ env, onProfileSyncError, profile });
			return (
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			);
		};

		const history = createMemoryHistory();
		history.push(transferURL);

		renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<Component />
			</Route>,
			{
				history,
				routes: [transferURL],
				withProfileSynchronizer: true,
			},
		);

		await waitFor(() => expect(screen.getByTestId("SendTransfer__network-step")).toBeTruthy());

		fireEvent.click(screen.getByTestId("NetworkIcon-ARK-ark.devnet"));
		await waitFor(() =>
			expect(screen.getByTestId("SelectNetworkInput__network")).toHaveAttribute("aria-label", "ARK Devnet"),
		);

		await waitFor(() => expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(screen.getByTestId("SendTransfer__form-step")).toBeTruthy());

		fireEvent.click(within(screen.getByTestId("sender-address")).getByTestId("SelectAddress__wrapper"));
		await waitFor(() => expect(screen.getByTestId("modal__inner")).toBeTruthy());

		fireEvent.click(screen.getByTestId("SearchWalletListItem__select-0"));
		await waitFor(() =>
			expect(screen.getByTestId("SelectAddress__input")).toHaveValue(profile.wallets().first().address()),
		);

		await waitFor(() => expect(onProfileSyncError).toHaveBeenCalled());
		walletMock.mockRestore();
	});

	it("should select cryptoasset", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__network-step")).toBeTruthy());

		const input = getByTestId("SelectNetworkInput__input");

		fireEvent.change(input, { target: { value: "no match" } });
		await waitFor(() => expect(input).toHaveValue("no match"));

		expect(input).toHaveAttribute("aria-invalid", "true");

		fireEvent.change(input, { target: { value: "ARK Dev" } });
		await waitFor(() => expect(input).toHaveValue("ARK Dev"));

		expect(input).not.toHaveAttribute("aria-invalid");

		fireEvent.change(input, { target: { value: "" } });
		await waitFor(() => expect(input).toHaveValue(""));

		expect(input).toHaveAttribute("aria-invalid", "true");

		await waitFor(() => expect(getByTestId("NetworkIcon-ARK-ark.devnet")).toBeTruthy());

		fireEvent.click(getByTestId("NetworkIcon-ARK-ark.devnet"));
		await waitFor(() => expect(input).toHaveValue("ARK Devnet"));

		expect(input).not.toHaveAttribute("aria-invalid");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should reset fields when network changed", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(screen.getByTestId("SendTransfer__network-step")).toBeTruthy());

		fireEvent.click(screen.getByTestId("NetworkIcon-ARK-ark.devnet"));
		await waitFor(() => expect(screen.getByTestId("SelectNetworkInput__input")).toHaveValue("ARK Devnet"));

		await waitFor(() => expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(screen.getByTestId("SendTransfer__form-step")).toBeTruthy());

		expect(screen.getByTestId("SelectNetworkInput__network")).toHaveAttribute("aria-label", "ARK Devnet");

		// Memo
		fireEvent.input(screen.getByTestId("Input__memo"), { target: { value: "test memo" } });
		await waitFor(() => expect(screen.getByTestId("Input__memo")).toHaveValue("test memo"));

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		// Previous step
		fireEvent.click(screen.getByTestId("StepNavigation__back-button"));
		await waitFor(() => expect(screen.getByTestId("SendTransfer__network-step")).toBeTruthy());

		// Change network
		// Unselect
		fireEvent.click(screen.getByTestId("NetworkIcon-ARK-ark.devnet"));
		await waitFor(() => expect(screen.getByTestId("SelectNetworkInput__input")).toBeEmpty());
		// Select
		fireEvent.click(screen.getByTestId("NetworkIcon-ARK-ark.devnet"));
		await waitFor(() => expect(screen.getByTestId("SelectNetworkInput__input")).toHaveValue("ARK Devnet"));

		await waitFor(() => expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		// Next step
		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(screen.getByTestId("SendTransfer__form-step")).toBeTruthy());

		// Memo
		expect(screen.getByTestId("Input__memo")).toBeEmpty();

		// Fee
		expect(screen.getAllByRole("radio")[0]).not.toBeChecked();
	});

	it("should select a cryptoasset and select sender without wallet id param", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__network-step")).toBeTruthy());

		fireEvent.click(getByTestId("NetworkIcon-ARK-ark.devnet"));
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue("ARK Devnet"));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		expect(getByTestId("SelectNetworkInput__network")).toHaveAttribute("aria-label", "ARK Devnet");

		// Select sender
		fireEvent.click(within(getByTestId("sender-address")).getByTestId("SelectAddress__wrapper"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		const firstAddress = getByTestId("SearchWalletListItem__select-1");

		fireEvent.click(firstAddress);

		expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/);

		await waitFor(() => expect(container).toMatchSnapshot());
	});

	it("should update available amount after sender address changed", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, getByText, queryByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__network-step")).toBeTruthy());

		fireEvent.click(getByTestId("NetworkIcon-ARK-ark.devnet"));
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue("ARK Devnet"));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		expect(getByTestId("SelectNetworkInput__network")).toHaveAttribute("aria-label", "ARK Devnet");

		// Select sender
		fireEvent.click(within(getByTestId("sender-address")).getByTestId("SelectAddress__wrapper"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		const secondAddress = getByTestId("SearchWalletListItem__select-1");
		fireEvent.click(secondAddress);

		expect(getByText("57.60679402")).toBeInTheDocument();

		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "55" } });

		await waitFor(() => expect(queryByTestId("Input__error")).not.toBeInTheDocument());

		// Select sender
		fireEvent.click(within(getByTestId("sender-address")).getByTestId("SelectAddress__wrapper"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		const firstAddress = getByTestId("SearchWalletListItem__select-0");
		fireEvent.click(firstAddress);

		expect(getByText("33.67769203")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("Input__error")).toBeInTheDocument());
	});

	it("should recalculate amount when fee changes and send all is selected", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.click(getByTestId("AddRecipient__send-all"));
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).not.toHaveValue("0"));

		expect(screen.getByTestId("AddRecipient__send-all")).toHaveClass("active");

		fireEvent.click(getByTestId("AddRecipient__send-all"));

		expect(screen.getByTestId("AddRecipient__send-all")).not.toHaveClass("active");

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.AVERAGE));
		await waitFor(() => expect(screen.getAllByRole("radio")[1]).toBeChecked());

		expect(screen.getAllByRole("radio")[1]).toHaveTextContent("0.07320598");

		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.FAST));
		await waitFor(() => expect(screen.getAllByRole("radio")[2]).toBeChecked());

		expect(screen.getAllByRole("radio")[2]).toHaveTextContent("0.1");
	});

	it("should keep the selected fee when user steps back", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getAllByTestId, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "12" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("12"));

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.FAST));
		await waitFor(() => expect(screen.getAllByRole("radio")[2]).toBeChecked());

		// Step 2
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		const backButton = getByTestId("StepNavigation__back-button");

		expect(backButton).not.toHaveAttribute("disabled");

		fireEvent.click(backButton);

		// Step 1 again
		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		// Thw fast fee should still be selected
		await waitFor(() => expect(screen.getAllByRole("radio")[2]).toBeChecked());

		// Go back to step 2 (the fast fee should still be the one used)
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		await waitFor(() => expect(getAllByTestId("AmountCrypto")).toBeTruthy());

		expect(getAllByTestId("AmountCrypto")[2]).toHaveTextContent("0.1");
	});

	it("should handle fee change", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${fixtureWalletId}/send-transfer?coin=ark&network=ark.devnet`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		// Amount
		const sendAll = getByTestId("AddRecipient__send-all");
		fireEvent.click(sendAll);
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).not.toHaveValue("0"));

		// Fee
		fireEvent.click(within(getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		fireEvent.click(within(getByTestId("InputFee")).getByText(transactionTranslations.FEES.AVERAGE));
		await waitFor(() => expect(screen.getAllByRole("radio")[1]).toBeChecked());

		expect(screen.getAllByRole("radio")[1]).toHaveTextContent("0.07320598");

		fireEvent.click(within(getByTestId("InputFee")).getByText(transactionTranslations.FEES.FAST));
		await waitFor(() => expect(screen.getAllByRole("radio")[2]).toBeChecked());

		expect(screen.getAllByRole("radio")[2]).toHaveTextContent("0.1");

		fireEvent.click(
			within(getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED),
		);

		fireEvent.change(getByTestId("InputCurrency"), { target: { value: "1000000000" } });
		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("1000000000"));
	});

	it.each(["with keyboard", "without keyboard"])("should send a single transfer", async (inputMethod) => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		const goSpy = jest.spyOn(history, "go").mockImplementation();

		const backButton = getByTestId("StepNavigation__back-button");

		expect(backButton).not.toHaveAttribute("disabled");

		fireEvent.click(backButton);

		expect(goSpy).toHaveBeenCalledWith(-1);

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });
		await waitFor(() => expect(getByTestId("Input__memo")).toHaveValue("test memo"));

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		// Step 2
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		if (inputMethod === "with keyboard") {
			userEvent.keyboard("{enter}");
		} else {
			fireEvent.click(getByTestId("StepNavigation__continue-button"));
		}

		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Step 3
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		if (inputMethod === "with keyboard") {
			userEvent.keyboard("{enter}");
		} else {
			fireEvent.click(getByTestId("StepNavigation__continue-button"));
		}
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		// Step 5 (skip step 4 for now - ledger confirmation)
		const signMock = jest
			.spyOn(wallet.transaction(), "signTransfer")
			.mockReturnValue(Promise.resolve(transactionFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [transactionFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());
		userEvent.keyboard("{enter}");
		fireEvent.click(getByTestId("StepNavigation__send-button"));

		await waitFor(() => expect(getByTestId("TransactionSuccessful")).toBeTruthy());
		await waitFor(() =>
			expect(getByTestId("TransactionSuccessful")).toHaveTextContent(
				"8f913b6b719e7767d49861c0aec79ced212767645cb793d75d2f1b89abb49877",
			),
		);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();

		await waitFor(() => expect(container).toMatchSnapshot());

		// Go back to wallet
		const pushSpy = jest.spyOn(history, "push");
		fireEvent.click(getByTestId("StepNavigation__back-to-wallet-button"));

		expect(pushSpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		goSpy.mockRestore();
		pushSpy.mockRestore();
	});

	it("should correctly handle fees when network's fee type is size", async () => {
		const { wallet: lskWallet } = await profile.walletFactory().generate({
			coin: "LSK",
			network: "lsk.testnet",
		});

		jest.spyOn(lskWallet, "balance").mockReturnValue(10);
		jest.spyOn(lskWallet, "isDelegate").mockReturnValue(false);

		profile.wallets().push(lskWallet);

		const transferURL = `/profiles/${fixtureProfileId}/wallets/${lskWallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const useFeesMock = jest.spyOn(useFeesHook, "useFees").mockReturnValue({
			calculate: () => Promise.resolve({ avg: 0.1, max: 0.1, min: 0.1, static: 0.1 }),
		});

		renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(screen.getByTestId("SelectNetworkInput__input")).toHaveValue("Lisk Testnet"));
		await waitFor(() => expect(screen.getByTestId("SelectAddress__input")).toHaveValue(lskWallet.address()));

		const goSpy = jest.spyOn(history, "go").mockImplementation();

		const backButton = screen.getByTestId("StepNavigation__back-button");

		expect(backButton).not.toHaveAttribute("disabled");

		fireEvent.click(backButton);

		expect(goSpy).toHaveBeenCalledWith(-1);

		// Select recipient
		fireEvent.input(screen.getByTestId("SelectDropdown__input"), {
			target: { value: "lsksktujwqbak4azhj57sd8rtc58y7tjb5tgq8oyk" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("SelectDropdown__input")).toHaveValue(
				"lsksktujwqbak4azhj57sd8rtc58y7tjb5tgq8oyk",
			),
		);

		// Set amount
		fireEvent.input(screen.getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(screen.getByTestId("AddRecipient__amount")).toHaveValue("1"));

		// Assert that fee initial value is 0 and then it changes to 0.1 when loaded
		expect(screen.getAllByRole("radio")[1]).toHaveTextContent("0 LSK");

		await waitFor(() => expect(screen.getAllByRole("radio")[1]).toHaveTextContent("0.1 LSK"));
		await waitFor(() => expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		// Continue to review step
		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		await waitFor(() => expect(screen.getByTestId("SendTransfer__review-step")).toBeTruthy());

		expect(
			within(screen.getByTestId("SendTransfer__review-step")).getAllByTestId("AmountCrypto")[0],
		).toHaveTextContent("1 LSK");
		expect(
			within(screen.getByTestId("SendTransfer__review-step")).getAllByTestId("AmountCrypto")[1],
		).toHaveTextContent("0.1 LSK");
		expect(
			within(screen.getByTestId("SendTransfer__review-step")).getAllByTestId("AmountCrypto")[2],
		).toHaveTextContent("1.1 LSK");

		expect(backButton).not.toHaveAttribute("disabled");

		// Go back to form step
		fireEvent.click(backButton);

		await waitFor(() => expect(screen.getByTestId("SendTransfer__form-step")).toBeTruthy());

		await waitFor(() => expect(screen.getAllByRole("radio")[1]).toHaveTextContent("0.1 LSK"));

		expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled();
		expect(screen.getByTestId("AddRecipient__amount")).toHaveValue("1");

		// Continue to review step
		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		await waitFor(() => expect(screen.getByTestId("SendTransfer__review-step")).toBeTruthy());

		expect(
			within(screen.getByTestId("SendTransfer__review-step")).getAllByTestId("AmountCrypto")[0],
		).toHaveTextContent("1 LSK");
		expect(
			within(screen.getByTestId("SendTransfer__review-step")).getAllByTestId("AmountCrypto")[1],
		).toHaveTextContent("0.1 LSK");
		expect(
			within(screen.getByTestId("SendTransfer__review-step")).getAllByTestId("AmountCrypto")[2],
		).toHaveTextContent("1.1 LSK");

		profile.wallets().forget(lskWallet.id());

		useFeesMock.mockRestore();
		goSpy.mockRestore();
	});

	it("should fail sending a single transfer", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		const goSpy = jest.spyOn(history, "go").mockImplementation();

		const backButton = getByTestId("StepNavigation__back-button");

		expect(backButton).not.toHaveAttribute("disabled");

		fireEvent.click(backButton);

		expect(goSpy).toHaveBeenCalledWith(-1);

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });
		await waitFor(() => expect(getByTestId("Input__memo")).toHaveValue("test memo"));

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		// Step 2
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Back to Step 1
		fireEvent.click(getByTestId("StepNavigation__back-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		// Step 2
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Step 3
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		// Step 5 (skip step 4 for now - ledger confirmation)
		const signMock = jest
			.spyOn(wallet.transaction(), "signTransfer")
			.mockReturnValue(Promise.resolve(transactionFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [],
			//@ts-ignore
			errors: { [transactionFixture.data.id]: "ERROR" },

			rejected: [transactionFixture.data.id],
		});
		const transactionMock = createTransactionMock(wallet);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__send-button"));

		await waitFor(() => expect(getByTestId("ErrorStep")).toBeTruthy());

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
	});

	it("should send a single transfer and handle undefined expiration", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		const goSpy = jest.spyOn(history, "go").mockImplementation();

		const backButton = getByTestId("StepNavigation__back-button");

		expect(backButton).not.toHaveAttribute("disabled");

		fireEvent.click(backButton);

		expect(goSpy).toHaveBeenCalledWith(-1);

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });
		await waitFor(() => expect(getByTestId("Input__memo")).toHaveValue("test memo"));

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		// Step 2
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Step 3
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		// Step 5 (skip step 4 for now - ledger confirmation)
		const signMock = jest
			.spyOn(wallet.transaction(), "signTransfer")
			.mockReturnValue(Promise.resolve(transactionFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [transactionFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);
		const expirationMock = jest
			.spyOn(wallet.coin().transaction(), "estimateExpiration")
			.mockResolvedValue(undefined);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__send-button"));

		await waitFor(() => expect(getByTestId("TransactionSuccessful")).toBeTruthy());
		await waitFor(() =>
			expect(getByTestId("TransactionSuccessful")).toHaveTextContent(
				"8f913b6b719e7767d49861c0aec79ced212767645cb793d75d2f1b89abb49877",
			),
		);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();

		await waitFor(() => expect(container).toMatchSnapshot());

		// Go back to wallet
		const pushSpy = jest.spyOn(history, "push");
		fireEvent.click(getByTestId("StepNavigation__back-to-wallet-button"));

		expect(pushSpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		goSpy.mockRestore();
		pushSpy.mockRestore();
		expirationMock.mockRestore();
	});

	it("should send a single transfer with a multisignature wallet", async () => {
		const isMultiSignatureSpy = jest.spyOn(wallet, "isMultiSignature").mockImplementation(() => true);
		const multisignatureSpy = jest
			.spyOn(wallet.multiSignature(), "all")
			.mockReturnValue({ min: 2, publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!] });

		const transferURL = `/profiles/${fixtureProfileId}/transactions/${wallet.id()}/transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/transactions/:walletId/transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		await waitFor(() => expect(getByTestId("AddRecipient__send-all")).toBeInTheDocument());
		fireEvent.click(getByTestId("AddRecipient__send-all"));
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).not.toHaveValue("0"), { timeout: 4000 });

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		// Step 2
		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Step 5 (skip step 4 for now - ledger confirmation)
		const signMock = jest
			.spyOn(wallet.transaction(), "signTransfer")
			.mockReturnValue(Promise.resolve(transactionFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [transactionFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		await waitFor(() => expect(getByTestId("TransactionSuccessful")).toBeTruthy());

		expect(getByTestId("TransactionSuccessful")).toHaveTextContent(
			"8f913b6b719e7767d49861c0aec79ced212767645cb793d75d2f1b89abb49877",
		);

		expect(signMock).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.anything(),
				fee: expect.any(Number),
				signatory: expect.any(Object),
			}),
		);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
		isMultiSignatureSpy.mockRestore();
		multisignatureSpy.mockRestore();
	});

	it("should send a single transfer with a ledger wallet", async () => {
		jest.useFakeTimers();
		const isLedgerSpy = jest.spyOn(wallet, "isLedger").mockImplementation(() => true);
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();
		const isNanoXMock = jest.spyOn(wallet.ledger(), "isNanoX").mockResolvedValue(true);

		const getPublicKeySpy = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue("0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb");

		const signTransactionSpy = jest
			.spyOn(wallet.transaction(), "signTransfer")
			.mockReturnValue(Promise.resolve(transactionFixture.data.id));

		const transactionMock = createTransactionMock(wallet);

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [transactionFixture.data.id],
			errors: {},
			rejected: [],
		});

		const transferURL = `/profiles/${fixtureProfileId}/transactions/${wallet.id()}/transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/transactions/:walletId/transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.click(getByTestId("AddRecipient__send-all"));
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).not.toHaveValue("0"), { timeout: 4000 });

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });

		expect(getByTestId("Input__memo")).toHaveValue("test memo");

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		const address = wallet.address();
		const balance = wallet.balance();
		const derivationPath = "m/44'/1'/1'/0/0";

		const mockWalletData = jest.spyOn(wallet.data(), "get").mockImplementation((key) => {
			if (key == Contracts.WalletData.Address) {
				return address;
			}
			if (key == Contracts.WalletData.Balance) {
				return balance;
			}

			if (key == Contracts.WalletData.DerivationPath) {
				return derivationPath;
			}
		});

		// Step 2
		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Step 3
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Auto broadcast
		await waitFor(() => expect(getByTestId("TransactionSuccessful")).toBeTruthy());

		getPublicKeySpy.mockRestore();
		broadcastMock.mockRestore();
		isLedgerSpy.mockRestore();
		signTransactionSpy.mockRestore();
		transactionMock.mockRestore();
		mockWalletData.mockRestore();
		isNanoXMock.mockRestore();
	});

	it("should return to form step by cancelling fee warning", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });
		await waitFor(() => expect(getByTestId("Input__memo")).toHaveValue("test memo"));

		// Fee
		fireEvent.click(
			within(getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED),
		);
		fireEvent.change(getByTestId("InputCurrency"), { target: { value: "" } });
		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue(""));

		await waitFor(() => {
			expect(getByTestId("Input__error")).toBeVisible();
		});

		fireEvent.change(getByTestId("InputCurrency"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("1"));

		await waitFor(() => expect(() => getByTestId("Input__error")).toThrow());

		// Step 2
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Fee warning
		await waitFor(() => expect(getByTestId("FeeWarning__cancel-button")).toBeTruthy());

		fireEvent.click(getByTestId("FeeWarning__cancel-button"));
		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow(/Unable to find an element by/));
	});

	it.each(["cancel", "continue"])(
		"should update the profile settings when dismissing the fee warning (%s)",
		async (action) => {
			const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

			const history = createMemoryHistory();
			history.push(transferURL);

			const { getByTestId } = renderWithRouter(
				<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
					<LedgerProvider transport={getDefaultLedgerTransport()}>
						<SendTransfer />
					</LedgerProvider>
				</Route>,
				{
					history,
					routes: [transferURL],
				},
			);

			await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

			const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
			await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
			await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

			// Select recipient
			fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

			expect(getByTestId("modal__inner")).toBeTruthy();

			fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
			await waitFor(() =>
				expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
			);

			// Amount
			fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
			await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

			// Memo
			fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });
			await waitFor(() => expect(getByTestId("Input__memo")).toHaveValue("test memo"));

			// Fee
			fireEvent.click(
				within(getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED),
			);

			fireEvent.change(getByTestId("InputCurrency"), { target: { value: "1" } });
			await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("1"));

			await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

			fireEvent.click(getByTestId("StepNavigation__continue-button"));

			// Review Step
			await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

			expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

			fireEvent.click(getByTestId("StepNavigation__continue-button"));

			const profileSpy = jest.spyOn(profile.settings(), "set").mockImplementation();

			// Fee warning
			await waitFor(() => expect(getByTestId("FeeWarning__suppressWarning-toggle")).toBeTruthy());
			fireEvent.click(getByTestId("FeeWarning__suppressWarning-toggle"));
			fireEvent.click(getByTestId(`FeeWarning__${action}-button`));

			expect(profileSpy).toHaveBeenCalledWith(Contracts.ProfileSetting.DoNotShowFeeWarning, true);

			await waitFor(() =>
				expect(
					getByTestId(action === "cancel" ? "SendTransfer__form-step" : "AuthenticationStep"),
				).toBeTruthy(),
			);

			profileSpy.mockRestore();
		},
	);

	it.each([
		["high", "1"],
		["low", "0.000001"],
	])("should send a single transfer with a %s fee by confirming the fee warning", async (type, fee) => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });
		await waitFor(() => expect(getByTestId("Input__memo")).toHaveValue("test memo"));

		// Fee
		fireEvent.click(
			within(getByTestId("InputFee")).getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED),
		);
		fireEvent.change(getByTestId("InputCurrency"), { target: { value: fee } });
		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue(fee));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Fee warning
		await waitFor(() => expect(getByTestId("FeeWarning__continue-button")).toBeTruthy());
		fireEvent.click(getByTestId("FeeWarning__continue-button"));

		// Auth Step
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		// Summary Step (skip ledger confirmation for now)
		const signMock = jest
			.spyOn(wallet.transaction(), "signTransfer")
			.mockReturnValue(Promise.resolve(transactionFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [transactionFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__send-button"));

		await waitFor(() => expect(getByTestId("TransactionSuccessful")).toBeTruthy());
		await waitFor(() =>
			expect(getByTestId("TransactionSuccessful")).toHaveTextContent(
				"8f913b6b719e7767d49861c0aec79ced212767645cb793d75d2f1b89abb49877",
			),
		);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();

		await waitFor(() => expect(container).toMatchSnapshot());

		// Go back to wallet
		const pushSpy = jest.spyOn(history, "push");
		fireEvent.click(getByTestId("StepNavigation__back-to-wallet-button"));

		expect(pushSpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		pushSpy.mockRestore();
	});

	it("should error if wrong mnemonic", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));

		expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address());

		// Amount
		fireEvent.click(getByTestId("AddRecipient__send-all"));
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).not.toHaveValue("0"), { timeout: 4000 });

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });

		expect(getByTestId("Input__memo")).toHaveValue("test memo");

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Auth Step
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled();

		fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), { target: { value: MNEMONICS[0] } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(MNEMONICS[0]));

		expect(getByTestId("StepNavigation__send-button")).toBeDisabled();

		await waitFor(() => expect(getByTestId("Input__error")).toBeVisible());

		expect(getByTestId("Input__error")).toHaveAttribute(
			"data-errortext",
			"This mnemonic does not correspond to your wallet",
		);
		expect(container).toMatchSnapshot();
	});

	it("should show error step and go back", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));

		expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address());

		// Amount
		fireEvent.click(getByTestId("AddRecipient__send-all"));
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).not.toHaveValue("0"), { timeout: 4000 });

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });

		expect(getByTestId("Input__memo")).toHaveValue("test memo");

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		// Step 2
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Step 3
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		// Step 5 (skip step 4 for now - ledger confirmation)
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockImplementation(() => {
			throw new Error("broadcast error");
		});

		const historyMock = jest.spyOn(history, "push").mockReturnValue();

		fireEvent.click(getByTestId("StepNavigation__send-button"));

		await waitFor(() => expect(getByTestId("ErrorStep")).toBeInTheDocument());

		expect(getByTestId("ErrorStep__errorMessage")).toHaveTextContent("broadcast error");
		expect(getByTestId("ErrorStep__wallet-button")).toBeInTheDocument();
		expect(getByTestId("clipboard-button__wrapper")).toBeInTheDocument();
		expect(container).toMatchSnapshot();

		fireEvent.click(getByTestId("ErrorStep__wallet-button"));

		const walletDetailPage = `/profiles/${getDefaultProfileId()}/wallets/${getDefaultWalletId()}`;
		await waitFor(() => expect(historyMock).toHaveBeenCalledWith(walletDetailPage));

		broadcastMock.mockRestore();
	});

	it("should send a multi payment", async () => {
		nock("https://ark-test.payvo.com")
			.get("/api/wallets/DFJ5Z51F1euNNdRUQJKQVdG4h495LZkc6T")
			.reply(200, require("tests/fixtures/coins/ark/devnet/wallets/DFJ5Z51F1euNNdRUQJKQVdG4h495LZkc6T.json"));

		nock("https://ark-test.payvo.com")
			.get("/api/wallets/DDA5nM7KEqLeTtQKv5qGgcnc6dpNBKJNTS")
			.reply(200, require("tests/fixtures/coins/ark/devnet/wallets/D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb.json"));

		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getAllByTestId, getByTestId, getByText } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => {
			expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address());
			expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel);
		});

		// Select multiple type
		fireEvent.click(getByText(transactionTranslations.MULTIPLE));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		fireEvent.change(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		fireEvent.click(getByTestId("AddRecipient__add-button"));
		await waitFor(() => expect(getAllByTestId("recipient-list__recipient-list-item").length).toEqual(1));

		// Select recipient #2
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));

		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		fireEvent.click(getByTestId("AddRecipient__add-button"));
		await waitFor(() => expect(getAllByTestId("recipient-list__recipient-list-item").length).toEqual(2));

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });
		await waitFor(() => expect(getByTestId("Input__memo")).toHaveValue("test memo"));

		// Fee
		fireEvent.click(within(getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.1");

		// Step 2
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Step 3
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		const passwordInput = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(passwordInput, { target: { value: passphrase } });
		await waitFor(() => expect(passwordInput).toHaveValue(passphrase));

		// Step 5 (skip step 4 for now - ledger confirmation)
		const coin = profile.coins().set("ARK", "ark.devnet");
		const coinMock = jest.spyOn(coin.address(), "validate").mockReturnValue(true);

		const signMock = jest
			.spyOn(wallet.transaction(), "signMultiPayment")
			.mockReturnValue(Promise.resolve(transactionMultipleFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [transactionFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMultipleMock(wallet);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__send-button"));

		await waitFor(() => expect(getByTestId("TransactionSuccessful")).toBeTruthy());

		coinMock.mockRestore();
		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
	});

	it("should require amount if not set", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: " " } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveAttribute("aria-invalid"));
	});

	it("should send a single transfer and show unconfirmed transactions modal", async () => {
		//@ts-ignore
		const sentTransactionsMock = jest.spyOn(wallet.transactionIndex(), "sent").mockImplementation(() =>
			Promise.resolve({
				items: () => [
					{
						convertedTotal: () => 0,
						isConfirmed: () => false,
						isMultiPayment: () => false,
						isSent: () => true,
						isTransfer: () => true,
						isUnvote: () => false,
						isVote: () => false,
						recipient: () => "D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
						recipients: () => ["D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb", wallet.address()],
						timestamp: () => DateTime.make(),
						total: () => 1,
						type: () => "transfer",
						wallet: () => wallet,
					},
					{
						convertedTotal: () => 0,
						isConfirmed: () => false,
						isMultiPayment: () => true,
						isSent: () => true,
						isTransfer: () => false,
						isUnvote: () => false,
						isVote: () => false,
						recipient: () => "D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
						recipients: () => ["D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb", wallet.address()],
						timestamp: () => DateTime.make(),
						total: () => 1,
						type: () => "multiPayment",
						wallet: () => wallet,
					},
				],
			}),
		);

		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		const goSpy = jest.spyOn(history, "go").mockImplementation();

		const backButton = getByTestId("StepNavigation__back-button");

		expect(backButton).not.toHaveAttribute("disabled");

		fireEvent.click(backButton);

		expect(goSpy).toHaveBeenCalledWith(-1);

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });
		await waitFor(() => expect(getByTestId("Input__memo")).toHaveValue("test memo"));

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		// Step 2
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Step 3
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		// Step 5 (skip step 4 for now - ledger confirmation)
		const signMock = jest
			.spyOn(wallet.transaction(), "signTransfer")
			.mockReturnValue(Promise.resolve(transactionFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [transactionFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__send-button"));

		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());
		fireEvent.click(getByTestId("ConfirmSendTransaction__cancel"));
		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow());

		fireEvent.click(getByTestId("StepNavigation__send-button"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		fireEvent.click(getByTestId("ConfirmSendTransaction__confirm"));
		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow());

		await waitFor(() => expect(getByTestId("TransactionSuccessful")).toBeTruthy());
		await waitFor(() =>
			expect(getByTestId("TransactionSuccessful")).toHaveTextContent(
				"8f913b6b719e7767d49861c0aec79ced212767645cb793d75d2f1b89abb49877",
			),
		);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();

		await waitFor(() => expect(container).toMatchSnapshot());

		// Go back to wallet
		const pushSpy = jest.spyOn(history, "push");
		fireEvent.click(getByTestId("StepNavigation__back-to-wallet-button"));

		expect(pushSpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		goSpy.mockRestore();
		pushSpy.mockRestore();
		sentTransactionsMock.mockRestore();
	});

	it("should display unconfirmed transactions modal when submitting with Enter", async () => {
		const sentTransactionsMock = jest.spyOn(wallet.transactionIndex(), "sent").mockImplementation(() =>
			Promise.resolve<any>({
				items: () => [
					{
						convertedTotal: () => 0,
						isConfirmed: () => false,
						isMultiPayment: () => false,
						isSent: () => true,
						isTransfer: () => true,
						isUnvote: () => false,
						isVote: () => false,
						recipient: () => "D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb",
						recipients: () => ["D5sRKWckH4rE1hQ9eeMeHAepgyC3cvJtwb", wallet.address()],
						timestamp: () => DateTime.make(),
						total: () => 1,
						type: () => "transfer",
						wallet: () => wallet,
					},
				],
			}),
		);

		const signMock = jest
			.spyOn(wallet.transaction(), "signTransfer")
			.mockReturnValue(Promise.resolve(transactionFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [transactionFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		// select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// enter amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		// proceed to step 2
		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// proceed to step 3
		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		// enter mnemonic
		fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		// submit form
		fireEvent.submit(getByTestId("Form"));
		await waitFor(() => expect(getByTestId("modal__inner")).toBeTruthy());

		// confirm within the modal
		fireEvent.click(getByTestId("ConfirmSendTransaction__confirm"));
		await waitFor(() => expect(() => getByTestId("modal__inner")).toThrow());

		await waitFor(() => expect(getByTestId("TransactionSuccessful")).toBeTruthy());
		await waitFor(() =>
			expect(getByTestId("TransactionSuccessful")).toHaveTextContent(
				"8f913b6b719e7767d49861c0aec79ced212767645cb793d75d2f1b89abb49877",
			),
		);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
		sentTransactionsMock.mockRestore();

		await waitFor(() => expect(container).toMatchSnapshot());
	});

	it("should send a single transfer using wallet with encryption password", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-transfer`;
		const actsWithMnemonicMock = jest.spyOn(wallet, "actsWithMnemonic").mockReturnValue(false);
		const actsWithWifWithEncryptionMock = jest.spyOn(wallet, "actsWithWifWithEncryption").mockReturnValue(true);
		const wifGetMock = jest.spyOn(wallet.signingKey(), "get").mockReturnValue(passphrase);

		const history = createMemoryHistory();
		history.push(transferURL);

		const { getByTestId, container } = renderWithRouter(
			<Route path="/profiles/:profileId/wallets/:walletId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(getByTestId("SendTransfer__form-step")).toBeTruthy());

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(getByTestId("SelectNetworkInput__input")).toHaveValue(networkLabel));
		await waitFor(() => expect(getByTestId("SelectAddress__input")).toHaveValue(wallet.address()));

		const goSpy = jest.spyOn(history, "go").mockImplementation();

		const backButton = getByTestId("StepNavigation__back-button");

		expect(backButton).not.toHaveAttribute("disabled");

		fireEvent.click(backButton);

		expect(goSpy).toHaveBeenCalledWith(-1);

		// Select recipient
		fireEvent.click(within(getByTestId("recipient-address")).getByTestId("SelectRecipient__select-recipient"));

		expect(getByTestId("modal__inner")).toBeTruthy();

		fireEvent.click(getByTestId("RecipientListItem__select-button-0"));
		await waitFor(() =>
			expect(getByTestId("SelectDropdown__input")).toHaveValue(profile.wallets().first().address()),
		);

		// Amount
		fireEvent.input(getByTestId("AddRecipient__amount"), { target: { value: "1" } });
		await waitFor(() => expect(getByTestId("AddRecipient__amount")).toHaveValue("1"));

		// Memo
		fireEvent.input(getByTestId("Input__memo"), { target: { value: "test memo" } });
		await waitFor(() => expect(getByTestId("Input__memo")).toHaveValue("test memo"));

		// Fee
		fireEvent.click(within(screen.getByTestId("InputFee")).getByText(transactionTranslations.FEES.SLOW));
		await waitFor(() => expect(screen.getAllByRole("radio")[0]).toBeChecked());

		expect(screen.getAllByRole("radio")[0]).toHaveTextContent("0.00357");

		// Step 2
		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("SendTransfer__review-step")).toBeTruthy());

		// Step 3
		expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));
		await waitFor(() => expect(getByTestId("AuthenticationStep")).toBeTruthy());

		fireEvent.input(getByTestId("AuthenticationStep__encryption-password"), { target: { value: "password" } });
		await waitFor(() => expect(getByTestId("AuthenticationStep__encryption-password")).toHaveValue("password"));

		// Step 5 (skip step 4 for now - ledger confirmation)
		const signMock = jest
			.spyOn(wallet.transaction(), "signTransfer")
			.mockReturnValue(Promise.resolve(transactionFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [transactionFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__send-button"));

		await waitFor(() => expect(getByTestId("TransactionSuccessful")).toBeTruthy());
		await waitFor(() =>
			expect(getByTestId("TransactionSuccessful")).toHaveTextContent(
				"8f913b6b719e7767d49861c0aec79ced212767645cb793d75d2f1b89abb49877",
			),
		);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
		actsWithMnemonicMock.mockRestore();
		actsWithWifWithEncryptionMock.mockRestore();
		wifGetMock.mockRestore();

		await waitFor(() => expect(container).toMatchSnapshot());

		// Go back to wallet
		const pushSpy = jest.spyOn(history, "push");
		fireEvent.click(getByTestId("StepNavigation__back-to-wallet-button"));

		expect(pushSpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		goSpy.mockRestore();
		pushSpy.mockRestore();
	});

	it("should show initial step when reset=1 is added to route query params", async () => {
		const transferURL = `/profiles/${fixtureProfileId}/send-transfer`;

		const history = createMemoryHistory();
		history.push(`${transferURL}?reset=1`);

		const replaceSpy = jest.spyOn(history, "replace").mockImplementation();

		renderWithRouter(
			<Route path="/profiles/:profileId/send-transfer">
				<LedgerProvider transport={getDefaultLedgerTransport()}>
					<SendTransfer />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [transferURL],
			},
		);

		await waitFor(() => expect(replaceSpy).toHaveBeenCalledWith(transferURL));

		expect(screen.getByTestId("SendTransfer__network-step")).toBeTruthy();

		replaceSpy.mockRestore();
	});
});
