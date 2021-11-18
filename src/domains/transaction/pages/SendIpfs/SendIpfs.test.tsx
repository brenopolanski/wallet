/* eslint-disable @typescript-eslint/require-await */
import { Contracts, DTO } from "@payvo/sdk-profiles";
import userEvent from "@testing-library/user-event";
import { LedgerProvider, minVersionList } from "app/contexts";
import { translations } from "domains/transaction/i18n";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { Route, Router } from "react-router-dom";
import ipfsFixture from "tests/fixtures/coins/ark/devnet/transactions/ipfs.json";
import {
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	getDefaultWalletId,
	getDefaultWalletMnemonic,
	MNEMONICS,
	render,
	renderWithForm,
	screen,
	syncFees,
	waitFor,
	within,
} from "utils/testing-library";

import { FormStep } from "./FormStep";
import { ReviewStep } from "./ReviewStep";
import { SendIpfs } from "./SendIpfs";
import { SummaryStep } from "./SummaryStep";

const passphrase = getDefaultWalletMnemonic();
const fixtureProfileId = getDefaultProfileId();

const createTransactionMock = (wallet: Contracts.IReadWriteWallet) =>
	// @ts-ignore
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => +ipfsFixture.data.amount / 1e8,
		data: () => ({ data: () => ipfsFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${ipfsFixture.data.id}`,
		fee: () => +ipfsFixture.data.fee / 1e8,
		hash: () => ipfsFixture.data.asset.ipfs,
		id: () => ipfsFixture.data.id,
		isMultiSignatureRegistration: () => false,
		recipient: () => ipfsFixture.data.recipient,
		sender: () => ipfsFixture.data.sender,
		type: () => "ipfs",
		usesMultiSignature: () => false,
	});

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
const transport = getDefaultLedgerTransport();
let getVersionSpy: jest.SpyInstance;

describe("SendIpfs", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(fixtureProfileId);

		nock("https://ark-test.payvo.com")
			.get("/api/transactions")
			.query({ address: "D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD" })
			.reply(200, require("tests/fixtures/coins/ark/devnet/transactions.json"))
			.get("/api/transactions/1e9b975eff66a731095876c3b6cbff14fd4dec3bb37a4127c46db3d69131067e")
			.reply(200, ipfsFixture);

		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");

		getVersionSpy = jest
			.spyOn(wallet.coin().ledger(), "getVersion")
			.mockResolvedValue(minVersionList[wallet.network().coin()]);

		await wallet.synchroniser().identity();

		await syncFees(profile);
	});

	afterAll(() => {
		getVersionSpy.mockRestore();
	});

	it("should render form step", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		const { asFragment } = renderWithForm(
			<Router history={history}>
				<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
					<LedgerProvider transport={transport}>
						<FormStep profile={profile} wallet={wallet} />
					</LedgerProvider>
				</Route>
			</Router>,
			{
				withProviders: true,
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render review step", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		const { asFragment, container } = renderWithForm(
			<Router history={history}>
				<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
					<LedgerProvider transport={transport}>
						<ReviewStep wallet={wallet} />
					</LedgerProvider>
				</Route>
			</Router>,
			{
				defaultValues: {
					fee: "0.1",
					hash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
					senderAddress: wallet.address(),
				},
				withProviders: true,
			},
		);

		expect(screen.getByTestId("SendIpfs__review-step")).toBeInTheDocument();
		expect(container).toHaveTextContent(wallet.network().name());
		expect(container).toHaveTextContent("D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD");
		expect(container).toHaveTextContent("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render summary step", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		const transaction = new DTO.ExtendedSignedTransactionData(
			await wallet
				.coin()
				.transaction()
				.ipfs({
					data: {
						hash: ipfsFixture.data.asset.ipfs,
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
		);

		const { asFragment } = renderWithForm(
			<Router history={history}>
				<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
					<LedgerProvider transport={transport}>
						<SummaryStep senderWallet={wallet} transaction={transaction} />
					</LedgerProvider>
				</Route>
			</Router>,
			{
				withProviders: true,
			},
		);

		await screen.findByTestId("TransactionSuccessful");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should navigate between steps", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() => expect(screen.getByTestId("TransactionSender")).toHaveTextContent(wallet.address()));

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__back-button"));
		await screen.findByTestId("SendIpfs__form-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		if (!profile.settings().get(Contracts.ProfileSetting.DoNotShowFeeWarning)) {
			await screen.findByTestId("FeeWarning__continue-button");
			fireEvent.click(screen.getByTestId("FeeWarning__continue-button"));
		}

		await screen.findByTestId("AuthenticationStep");
	});

	it("should send an IPFS transaction and go back to wallet page", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() => expect(screen.getByTestId("TransactionSender")).toHaveTextContent(wallet.address()));

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		expect(within(screen.getByTestId("InputFee")).getAllByRole("radio")[1]).toBeChecked();

		fireEvent.click(within(screen.getByTestId("InputFee")).getAllByRole("radio")[2]);
		await waitFor(() => expect(within(screen.getByTestId("InputFee")).getAllByRole("radio")[2]).toBeChecked());

		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		if (!profile.settings().get(Contracts.ProfileSetting.DoNotShowFeeWarning)) {
			await screen.findByTestId("FeeWarning__continue-button");
			fireEvent.click(screen.getByTestId("FeeWarning__continue-button"));
		}

		await screen.findByTestId("AuthenticationStep");

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		// Step 4
		const signMock = jest
			.spyOn(wallet.transaction(), "signIpfs")
			.mockReturnValue(Promise.resolve(ipfsFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [ipfsFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await waitFor(() => expect(screen.getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		fireEvent.click(screen.getByTestId("StepNavigation__send-button"));
		await screen.findByTestId("TransactionSuccessful");

		expect(screen.getByTestId("TransactionSuccessful")).toHaveTextContent(
			"1e9b975eff66a731095876c3b6cbff14fd4dec3bb37a4127c46db3d69131067e",
		);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();

		expect(asFragment()).toMatchSnapshot();

		// Go back to wallet
		const historySpy = jest.spyOn(history, "push");

		fireEvent.click(screen.getByTestId("StepNavigation__back-to-wallet-button"));

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		historySpy.mockRestore();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should send an IPFS transaction navigating with keyboard", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() => expect(screen.getByTestId("TransactionSender")).toHaveTextContent(wallet.address()));

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		expect(within(screen.getByTestId("InputFee")).getAllByRole("radio")[1]).toBeChecked();

		fireEvent.click(within(screen.getByTestId("InputFee")).getAllByRole("radio")[2]);
		await waitFor(() => expect(within(screen.getByTestId("InputFee")).getAllByRole("radio")[2]).toBeChecked());

		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		userEvent.keyboard("{enter}");
		await screen.findByTestId("SendIpfs__review-step");

		userEvent.keyboard("{enter}");

		if (!profile.settings().get(Contracts.ProfileSetting.DoNotShowFeeWarning)) {
			await screen.findByTestId("FeeWarning__continue-button");
			fireEvent.click(screen.getByTestId("FeeWarning__continue-button"));
		}

		await screen.findByTestId("AuthenticationStep");

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		// Step 4
		const signMock = jest
			.spyOn(wallet.transaction(), "signIpfs")
			.mockReturnValue(Promise.resolve(ipfsFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [ipfsFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await waitFor(() => expect(screen.getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		userEvent.keyboard("{enter}");
		fireEvent.click(screen.getByTestId("StepNavigation__send-button"));
		await screen.findByTestId("TransactionSuccessful");

		expect(screen.getByTestId("TransactionSuccessful")).toHaveTextContent(
			"1e9b975eff66a731095876c3b6cbff14fd4dec3bb37a4127c46db3d69131067e",
		);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
	});

	it("should return to form step by cancelling fee warning", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() => expect(screen.getByTestId("TransactionSender")).toHaveTextContent(wallet.address()));

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		expect(screen.getByTestId("FeeWarning__cancel-button")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("FeeWarning__cancel-button"));
		await screen.findByTestId("SendIpfs__form-step");
	});

	it("should proceed to authentication step by confirming fee warning", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() => expect(screen.getByTestId("TransactionSender")).toHaveTextContent(wallet.address()));

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		// Fee
		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("FeeWarning__continue-button");

		fireEvent.click(screen.getByTestId("FeeWarning__continue-button"));
		await screen.findByTestId("AuthenticationStep");
	});

	it("should error if wrong mnemonic", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() => expect(screen.getByTestId("TransactionSender")).toHaveTextContent(wallet.address()));

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		// Fee
		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		if (!profile.settings().get(Contracts.ProfileSetting.DoNotShowFeeWarning)) {
			await screen.findByTestId("FeeWarning__continue-button");
			fireEvent.click(screen.getByTestId("FeeWarning__continue-button"));
		}

		// Auth Step
		await screen.findByTestId("AuthenticationStep");

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		expect(screen.getByTestId("StepNavigation__send-button")).not.toBeDisabled();

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), { target: { value: MNEMONICS[0] } });
		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__mnemonic")).toHaveValue(MNEMONICS[0]));

		expect(screen.getByTestId("StepNavigation__send-button")).toBeDisabled();

		await waitFor(() => expect(screen.getByTestId("Input__error")).toBeVisible());

		expect(screen.getByTestId("Input__error")).toHaveAttribute(
			"data-errortext",
			"This mnemonic does not correspond to your wallet",
		);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should go back to wallet details", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const historySpy = jest.spyOn(history, "push").mockImplementation();

		fireEvent.click(screen.getByTestId("StepNavigation__back-button"));

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		historySpy.mockRestore();
	});

	it("should show error step and go back", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() => expect(screen.getByTestId("TransactionSender")).toHaveTextContent(wallet.address()));

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		if (!profile.settings().get(Contracts.ProfileSetting.DoNotShowFeeWarning)) {
			await screen.findByTestId("FeeWarning__continue-button");
			fireEvent.click(screen.getByTestId("FeeWarning__continue-button"));
		}

		await screen.findByTestId("AuthenticationStep");

		fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), { target: { value: passphrase } });
		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

		// Step 5 (skip step 4 for now - ledger confirmation)
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockImplementation(() => {
			throw new Error("broadcast error");
		});

		fireEvent.click(screen.getByTestId("StepNavigation__send-button"));

		await screen.findByTestId("ErrorStep");

		expect(screen.getByTestId("ErrorStep__errorMessage")).toHaveTextContent("broadcast error");
		expect(screen.getByTestId("ErrorStep__wallet-button")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();

		const historyMock = jest.spyOn(history, "push").mockReturnValue();

		fireEvent.click(screen.getByTestId("ErrorStep__wallet-button"));

		expect(historyMock).toHaveBeenCalledWith(`/profiles/${getDefaultProfileId()}/wallets/${getDefaultWalletId()}`);

		broadcastMock.mockRestore();
	});

	it("should show an error if an invalid IPFS hash is entered", async () => {
		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "invalid-ipfs-hash" },
		});
		await waitFor(() => expect(screen.getByTestId("Input__hash")).toHaveValue("invalid-ipfs-hash"));

		expect(screen.getByTestId("Input__error")).toBeVisible();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should send an ipfs transaction with a multisig wallet", async () => {
		const isMultiSignatureSpy = jest.spyOn(wallet, "isMultiSignature").mockReturnValue(true);
		const multisignatureSpy = jest
			.spyOn(wallet.multiSignature(), "all")
			.mockReturnValue({ min: 2, publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!] });

		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/transactions/${wallet.id()}/ipfs`;

		history.push(ipfsURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/transactions/:walletId/ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() => expect(screen.getByTestId("TransactionSender")).toHaveTextContent(wallet.address()));

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		if (!profile.settings().get(Contracts.ProfileSetting.DoNotShowFeeWarning)) {
			await screen.findByTestId("FeeWarning__continue-button");
			fireEvent.click(screen.getByTestId("FeeWarning__continue-button"));
		}

		// Step 4
		const signMock = jest
			.spyOn(wallet.transaction(), "signIpfs")
			.mockReturnValue(Promise.resolve(ipfsFixture.data.id));

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [ipfsFixture.data.id],
			errors: {},
			rejected: [],
		});

		const transactionMock = createTransactionMock(wallet);

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("TransactionSuccessful");

		expect(screen.getByTestId("TransactionSuccessful")).toHaveTextContent(
			"1e9b975eff66a731095876c3b6cbff14fd4dec3bb37a4127c46db3d69131067e",
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
		multisignatureSpy.mockRestore();
		isMultiSignatureSpy.mockRestore();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should send a ipfs transfer with a ledger wallet", async () => {
		jest.spyOn(wallet.coin(), "__construct").mockImplementation();
		const isNanoXMock = jest.spyOn(wallet.ledger(), "isNanoX").mockResolvedValue(true);

		const isLedgerSpy = jest.spyOn(wallet, "isLedger").mockImplementation(() => true);

		const getPublicKeySpy = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue("0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb");

		const signTransactionSpy = jest
			.spyOn(wallet.transaction(), "signIpfs")
			.mockReturnValue(Promise.resolve(ipfsFixture.data.id));

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [ipfsFixture.data.id],
			errors: {},
			rejected: [],
		});

		const transactionMock = createTransactionMock(wallet);

		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/transactions/${wallet.id()}/ipfs`;

		history.push(ipfsURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/transactions/:walletId/ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() => expect(screen.getByTestId("TransactionSender")).toHaveTextContent(wallet.address()));

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		const address = wallet.address();
		const balance = wallet.balance();
		const derivationPath = "m/44'/1'/1'/0/0";
		const votes = wallet.voting().current();
		const publicKey = wallet.publicKey();

		const mockWalletData = jest.spyOn(wallet.data(), "get").mockImplementation((key) => {
			if (key == Contracts.WalletData.Address) {
				return address;
			}
			if (key == Contracts.WalletData.Address) {
				return address;
			}

			if (key == Contracts.WalletData.Balance) {
				return balance;
			}

			if (key == Contracts.WalletData.PublicKey) {
				return publicKey;
			}

			if (key == Contracts.WalletData.Votes) {
				return votes;
			}

			if (key == Contracts.WalletData.DerivationPath) {
				return derivationPath;
			}
		});

		expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		if (!profile.settings().get(Contracts.ProfileSetting.DoNotShowFeeWarning)) {
			await screen.findByTestId("FeeWarning__continue-button");
			fireEvent.click(screen.getByTestId("FeeWarning__continue-button"));
		}

		// Auto broadcast
		await screen.findByTestId("TransactionSuccessful");

		getPublicKeySpy.mockRestore();
		broadcastMock.mockRestore();
		isLedgerSpy.mockRestore();
		signTransactionSpy.mockRestore();
		transactionMock.mockRestore();
		mockWalletData.mockRestore();
		isNanoXMock.mockRestore();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should send an IPFS transaction using encryption password", async () => {
		const encryptedWallet = profile.wallets().first();
		const actsWithMnemonicMock = jest.spyOn(encryptedWallet, "actsWithMnemonic").mockReturnValue(false);
		const actsWithWifWithEncryptionMock = jest
			.spyOn(encryptedWallet, "actsWithWifWithEncryption")
			.mockReturnValue(true);
		const wifGetMock = jest.spyOn(encryptedWallet.signingKey(), "get").mockReturnValue(passphrase);

		const history = createMemoryHistory();
		const ipfsURL = `/profiles/${fixtureProfileId}/wallets/${encryptedWallet.id()}/send-ipfs`;

		history.push(ipfsURL);

		const { asFragment } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-ipfs">
				<LedgerProvider transport={transport}>
					<SendIpfs />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [ipfsURL],
			},
		);

		await screen.findByTestId("SendIpfs__form-step");

		const networkLabel = `${wallet.network().coin()} ${wallet.network().name()}`;
		await waitFor(() => expect(screen.getByTestId("TransactionNetwork")).toHaveTextContent(networkLabel));
		await waitFor(() =>
			expect(screen.getByTestId("TransactionSender")).toHaveTextContent(encryptedWallet.address()),
		);

		fireEvent.input(screen.getByTestId("Input__hash"), {
			target: { value: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("Input__hash")).toHaveValue("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
		);

		fireEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(screen.getByTestId("InputCurrency"), { target: { value: "10" } });
		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		expect(screen.getByTestId("StepNavigation__continue-button")).not.toBeDisabled();

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));
		await screen.findByTestId("SendIpfs__review-step");

		fireEvent.click(screen.getByTestId("StepNavigation__continue-button"));

		if (!profile.settings().get(Contracts.ProfileSetting.DoNotShowFeeWarning)) {
			await screen.findByTestId("FeeWarning__continue-button");
			fireEvent.click(screen.getByTestId("FeeWarning__continue-button"));
		}

		await screen.findByTestId("AuthenticationStep");

		fireEvent.input(screen.getByTestId("AuthenticationStep__encryption-password"), {
			target: { value: "password" },
		});
		await waitFor(() =>
			expect(screen.getByTestId("AuthenticationStep__encryption-password")).toHaveValue("password"),
		);

		const signMock = jest
			.spyOn(encryptedWallet.transaction(), "signIpfs")
			.mockReturnValue(Promise.resolve(ipfsFixture.data.id));

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [ipfsFixture.data.id],
			errors: {},
			rejected: [],
		});

		const transactionMock = createTransactionMock(encryptedWallet);

		await waitFor(() => expect(screen.getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		fireEvent.click(screen.getByTestId("StepNavigation__send-button"));
		await screen.findByTestId("TransactionSuccessful");

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
		actsWithMnemonicMock.mockRestore();
		actsWithWifWithEncryptionMock.mockRestore();
		wifGetMock.mockRestore();

		expect(asFragment()).toMatchSnapshot();
	});
});
