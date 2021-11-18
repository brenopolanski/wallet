/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable testing-library/no-unnecessary-act */ // @TODO remove and fix test
import { Signatories } from "@payvo/sdk";
import { Contracts } from "@payvo/sdk-profiles";
// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/sdk-profiles/distribution/read-only-wallet";
import { screen, within } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import { LedgerProvider } from "app/contexts";
import { translations as transactionTranslations } from "domains/transaction/i18n";
import { VoteDelegateProperties } from "domains/vote/components/DelegateTable/DelegateTable.models";
import { appendParameters } from "domains/vote/utils/url-parameters";
import { createMemoryHistory } from "history";
import nock from "nock";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Route } from "react-router-dom";
import { data as delegateData } from "tests/fixtures/coins/ark/devnet/delegates.json";
import unvoteFixture from "tests/fixtures/coins/ark/devnet/transactions/unvote.json";
import voteFixture from "tests/fixtures/coins/ark/devnet/transactions/vote.json";
import {
	act,
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	getDefaultWalletId,
	getDefaultWalletMnemonic,
	render,
	syncDelegates,
	syncFees,
	waitFor,
} from "utils/testing-library";

import { SendVote } from "./SendVote";

const fixtureProfileId = getDefaultProfileId();

const createVoteTransactionMock = (wallet: Contracts.IReadWriteWallet) =>
	// @ts-ignore
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => voteFixture.data.amount / 1e8,
		data: () => ({ data: () => voteFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${voteFixture.data.id}`,
		fee: () => voteFixture.data.fee / 1e8,
		id: () => voteFixture.data.id,
		isMultiSignatureRegistration: () => false,
		recipient: () => voteFixture.data.recipient,
		sender: () => voteFixture.data.sender,
		type: () => "vote",
		usesMultiSignature: () => false,
	});

const createUnvoteTransactionMock = (wallet: Contracts.IReadWriteWallet) =>
	// @ts-ignore
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => unvoteFixture.data.amount / 1e8,
		data: () => ({ data: () => voteFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${unvoteFixture.data.id}`,
		fee: () => unvoteFixture.data.fee / 1e8,
		id: () => unvoteFixture.data.id,
		isMultiSignatureRegistration: () => false,
		recipient: () => unvoteFixture.data.recipient,
		sender: () => unvoteFixture.data.sender,
		type: () => "unvote",
		usesMultiSignature: () => false,
	});

const passphrase = getDefaultWalletMnemonic();
let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
const transport = getDefaultLedgerTransport();

describe("SendVote", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		await wallet.synchroniser().identity();

		jest.spyOn(wallet, "isDelegate").mockImplementation(() => true);

		await syncDelegates(profile);
		await syncFees(profile);

		[0, 1].map((index) =>
			env.delegates().findByAddress(wallet.coinId(), wallet.networkId(), delegateData[index].address),
		);

		nock.disableNetConnect();

		nock("https://ark-test.payvo.com")
			.get("/api/transactions/d819c5199e323a62a4349948ff075edde91e509028329f66ec76b8518ad1e493")
			.reply(200, voteFixture)
			.get("/api/transactions/32e5278cb72f24f2c04c4797dbfbffa7072f6a30e016093fdd3f7660a2ee2faf")
			.reply(200, unvoteFixture)
			.persist();
	});

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it("should return to the select a delegate page to vote", async () => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { container, getByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		// Back to select a delegate page
		await waitFor(() => expect(getByTestId("StepNavigation__back-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__back-button"));

		expect(container).toMatchSnapshot();
	});

	it("should return to the select a delegate page to unvote", async () => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const unvotes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[1].address,
			},
		];

		appendParameters(parameters, "unvote", unvotes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { container, getByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[1].username));

		// Back to select a delegate page
		await waitFor(() => expect(getByTestId("StepNavigation__back-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__back-button"));

		expect(container).toMatchSnapshot();
	});

	it("should return to the select a delegate page to unvote/vote", async () => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const unvotes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[1].address,
			},
		];

		appendParameters(parameters, "unvote", unvotes);

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { container, getByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		// Back to select a delegate page
		await waitFor(() => expect(getByTestId("StepNavigation__back-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__back-button"));

		expect(container).toMatchSnapshot();
	});

	it("should send a unvote & vote transaction", async () => {
		const votesMock = jest.spyOn(wallet.voting(), "current").mockImplementation(() => [
			{
				amount: 10,
				wallet: new ReadOnlyWallet({
					address: delegateData[1].address,
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: false,
					publicKey: delegateData[1].publicKey,
					username: delegateData[1].username,
				}),
			},
		]);
		await wallet.synchroniser().votes();

		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const unvotes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[1].address,
			},
		];

		appendParameters(parameters, "unvote", unvotes);

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		expect(screen.getAllByRole("radio")[1]).toBeChecked();

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// AuthenticationStep
		expect(getByTestId("AuthenticationStep")).toBeInTheDocument();

		const signUnvoteMock = jest
			.spyOn(wallet.transaction(), "signVote")
			.mockReturnValue(Promise.resolve(unvoteFixture.data.id));
		const broadcastUnvoteMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [unvoteFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionUnvoteMock = createVoteTransactionMock(wallet);

		const signVoteMock = jest
			.spyOn(wallet.transaction(), "signVote")
			.mockReturnValue(Promise.resolve(voteFixture.data.id));
		const broadcastVoteMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [voteFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionVoteMock = createVoteTransactionMock(wallet);

		const passwordInput = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(passwordInput, { target: { value: passphrase } });

		expect(passwordInput).toHaveValue(passphrase);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		await act(async () => {
			fireEvent.click(getByTestId("StepNavigation__send-button"));
		});

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		setTimeout(() => {
			votesMock.mockRestore();
		}, 3000);

		act(() => {
			jest.runOnlyPendingTimers();
		});

		await findByTestId("TransactionSuccessful");
		await waitFor(() => expect(setInterval).toHaveBeenCalledTimes(1));

		const historySpy = jest.spyOn(history, "push");

		// Go back to wallet
		fireEvent.click(getByTestId("StepNavigation__back-to-wallet-button"));

		expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

		historySpy.mockRestore();

		signUnvoteMock.mockRestore();
		broadcastUnvoteMock.mockRestore();
		transactionUnvoteMock.mockRestore();

		signVoteMock.mockRestore();
		broadcastVoteMock.mockRestore();
		transactionVoteMock.mockRestore();
	});

	it("should send a unvote & vote transaction and use split voting method", async () => {
		const votesMock = jest.spyOn(wallet.voting(), "current").mockImplementation(() => [
			{
				amount: 10,
				wallet: new ReadOnlyWallet({
					address: delegateData[1].address,
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: false,
					publicKey: delegateData[1].publicKey,
					username: delegateData[1].username,
				}),
			},
		]);
		await wallet.synchroniser().votes();

		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const unvotes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[1].address,
			},
		];

		appendParameters(parameters, "unvote", unvotes);

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		expect(screen.getAllByRole("radio")[1]).toBeChecked();

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// AuthenticationStep
		expect(getByTestId("AuthenticationStep")).toBeInTheDocument();

		const signMock = jest
			.spyOn(wallet.transaction(), "signVote")
			.mockReturnValueOnce(Promise.resolve(unvoteFixture.data.id))
			.mockReturnValueOnce(Promise.resolve(voteFixture.data.id));

		const broadcastMock = jest
			.spyOn(wallet.transaction(), "broadcast")
			.mockResolvedValueOnce({
				accepted: [unvoteFixture.data.id],
				errors: {},
				rejected: [],
			})
			.mockResolvedValueOnce({
				accepted: [voteFixture.data.id],
				errors: {},
				rejected: [],
			});

		const splitVotingMethodMock = jest.spyOn(wallet.network(), "votingMethod").mockReturnValue("split");

		const transactionUnvoteMock = createUnvoteTransactionMock(wallet);
		const transactionVoteMock = createVoteTransactionMock(wallet);

		const passwordInput = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(passwordInput, { target: { value: passphrase } });

		expect(passwordInput).toHaveValue(passphrase);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		await act(async () => {
			fireEvent.click(getByTestId("StepNavigation__send-button"));
		});

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		setTimeout(() => {
			votesMock.mockRestore();
		}, 3000);

		act(() => {
			jest.runOnlyPendingTimers();
		});

		await waitFor(() => expect(setInterval).toHaveBeenCalledTimes(1));
		await waitFor(() => {
			expect(signMock).toHaveBeenNthCalledWith(1, {
				data: {
					unvotes: [
						{
							amount: 10,
							id: delegateData[1].publicKey,
						},
					],
				},
				fee: 0.01,
				signatory: expect.any(Signatories.Signatory),
			});
		});

		await waitFor(() => expect(broadcastMock).toHaveBeenNthCalledWith(1, unvoteFixture.data.id));

		await waitFor(() =>
			expect(signMock).toHaveBeenNthCalledWith(2, {
				data: {
					votes: [
						{
							amount: 10,
							id: delegateData[0].publicKey,
						},
					],
				},
				fee: 0.01,
				signatory: expect.any(Signatories.Signatory),
			}),
		);

		await waitFor(() => expect(broadcastMock).toHaveBeenNthCalledWith(2, voteFixture.data.id));

		await findByTestId("TransactionSuccessful");

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionUnvoteMock.mockRestore();
		transactionVoteMock.mockRestore();
		splitVotingMethodMock.mockRestore();
	});

	it.each(["with keyboard", "without keyboard"])("should send a vote transaction %s", async (inputMethod) => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					fee: "0.1",
				},
			}),
		);

		const { container, getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<FormProvider {...form.current}>
					<LedgerProvider transport={transport}>
						<SendVote />
					</LedgerProvider>
				</FormProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		// Fee
		expect(screen.getAllByRole("radio")[1]).toBeChecked();

		fireEvent.click(within(screen.getByTestId("InputFee")).getAllByRole("radio")[2]);

		expect(screen.getAllByRole("radio")[2]).toBeChecked();

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		if (inputMethod === "with keyboard") {
			userEvent.keyboard("{enter}");
		} else {
			fireEvent.click(getByTestId("StepNavigation__continue-button"));
		}

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		if (inputMethod === "with keyboard") {
			userEvent.keyboard("{enter}");
		} else {
			fireEvent.click(getByTestId("StepNavigation__continue-button"));
		}

		// AuthenticationStep
		expect(getByTestId("AuthenticationStep")).toBeInTheDocument();

		const signMock = jest
			.spyOn(wallet.transaction(), "signVote")
			.mockReturnValue(Promise.resolve(voteFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [voteFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createVoteTransactionMock(wallet);

		const passwordInput = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(passwordInput, { target: { value: passphrase } });

		expect(passwordInput).toHaveValue(passphrase);

		userEvent.keyboard("{enter}");
		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		await act(async () => {
			fireEvent.click(getByTestId("StepNavigation__send-button"));
		});

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		await findByTestId("TransactionSuccessful");
		await waitFor(() => expect(container).toMatchSnapshot());

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
	});

	it("should keep the fee when user step back", async () => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const unvotes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[1].address,
			},
		];

		appendParameters(parameters, "unvote", unvotes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { getByTestId, getByText, getAllByTestId, findAllByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[1].username));

		fireEvent.click(getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED));

		fireEvent.input(getByTestId("InputCurrency"), { target: { value: "0.02" } });

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		// Back to form
		fireEvent.click(getByTestId("StepNavigation__back-button"));
		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("0.02"));

		// Back to review step
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		await findAllByTestId("Amount");

		expect(getAllByTestId("Amount")[3]).toHaveTextContent("0.02");
	});

	it("should move back and forth between steps", async () => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const unvotes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[1].address,
			},
		];

		appendParameters(parameters, "unvote", unvotes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { getByTestId, getByText } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[1].username));

		fireEvent.click(getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED));

		fireEvent.input(getByTestId("InputCurrency"), { target: { value: "0.02" } });

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		// Back to form
		fireEvent.click(getByTestId("StepNavigation__back-button"));
		await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("0.02"));

		// Back to review step
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Authentication Step
		expect(getByTestId("AuthenticationStep")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__back-button"));

		// Back to Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Back to AuthenticationStep
		expect(getByTestId("AuthenticationStep")).toBeInTheDocument();

		const passwordInput = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(passwordInput, { target: { value: passphrase } });
		await waitFor(() => expect(passwordInput).toHaveValue(passphrase));
	});

	it("should send a unvote transaction", async () => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const unvotes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[1].address,
			},
		];

		appendParameters(parameters, "unvote", unvotes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { container, getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[1].username));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// AuthenticationStep
		expect(getByTestId("AuthenticationStep")).toBeInTheDocument();

		const signMock = jest
			.spyOn(wallet.transaction(), "signVote")
			.mockReturnValue(Promise.resolve(unvoteFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [unvoteFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createUnvoteTransactionMock(wallet);

		const passwordInput = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(passwordInput, { target: { value: passphrase } });

		expect(passwordInput).toHaveValue(passphrase);

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		await act(async () => {
			fireEvent.click(getByTestId("StepNavigation__send-button"));
		});

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		await findByTestId("TransactionSuccessful");
		await waitFor(() => expect(container).toMatchSnapshot());

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
	});

	it("should return to form step by cancelling fee warning", async () => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { getByTestId, getByText, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		// Fee
		fireEvent.click(getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(getByTestId("InputCurrency"), { target: { value: "10" } });

		expect(getByTestId("InputCurrency")).toHaveValue("10");

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Fee warning
		expect(getByTestId("FeeWarning__cancel-button")).toBeInTheDocument();

		fireEvent.click(getByTestId("FeeWarning__cancel-button"));

		await findByTestId("SendVote__form-step");
	});

	it("should proceed to authentication step by confirming fee warning", async () => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { getByTestId, getByText, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		// Fee
		fireEvent.click(getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED));
		fireEvent.change(getByTestId("InputCurrency"), { target: { value: "10" } });

		expect(getByTestId("InputCurrency")).toHaveValue("10");

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Fee warning
		expect(getByTestId("FeeWarning__continue-button")).toBeInTheDocument();

		fireEvent.click(getByTestId("FeeWarning__continue-button"));

		await findByTestId("AuthenticationStep");
	});

	it("should show error if wrong mnemonic", async () => {
		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { container, getByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// AuthenticationStep
		expect(getByTestId("AuthenticationStep")).toBeInTheDocument();

		const passwordInput = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(passwordInput, { target: { value: "wrong passphrase" } });
		await waitFor(() => expect(passwordInput).toHaveValue("wrong passphrase"));

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).toBeDisabled());

		expect(getByTestId("Input__error")).toBeInTheDocument();

		await waitFor(() => expect(container).toMatchSnapshot());
	});

	it("should show error step and go back", async () => {
		jest.useRealTimers();

		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { container, getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		await findByTestId("SendVote__review-step");

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// AuthenticationStep
		await findByTestId("AuthenticationStep");

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockImplementation(() => {
			throw new Error("broadcast error");
		});

		const passwordInput = getByTestId("AuthenticationStep__mnemonic");
		fireEvent.input(passwordInput, { target: { value: passphrase } });
		await waitFor(() => expect(passwordInput).toHaveValue(passphrase));

		const historyMock = jest.spyOn(history, "push").mockReturnValue();
		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		fireEvent.click(getByTestId("StepNavigation__send-button"));
		await findByTestId("ErrorStep");

		expect(getByTestId("ErrorStep__errorMessage")).toHaveTextContent("broadcast error");
		expect(getByTestId("ErrorStep__wallet-button")).toBeInTheDocument();
		expect(container).toMatchSnapshot();

		fireEvent.click(getByTestId("ErrorStep__wallet-button"));

		const walletDetailPage = `/profiles/${getDefaultProfileId()}/wallets/${getDefaultWalletId()}`;
		await waitFor(() => expect(historyMock).toHaveBeenCalledWith(walletDetailPage));

		broadcastMock.mockRestore();
	});

	it("should send a unvote transaction with a multisignature wallet", async () => {
		const isMultiSignatureSpy = jest.spyOn(wallet, "isMultiSignature").mockReturnValue(true);
		const multisignatureSpy = jest
			.spyOn(wallet.multiSignature(), "all")
			.mockReturnValue({ min: 2, publicKeys: [wallet.publicKey()!, profile.wallets().last().publicKey()!] });

		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const unvotes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[1].address,
			},
		];

		appendParameters(parameters, "unvote", unvotes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[1].username));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		const signMock = jest
			.spyOn(wallet.transaction(), "signVote")
			.mockReturnValue(Promise.resolve(unvoteFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [unvoteFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createUnvoteTransactionMock(wallet);

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		await act(async () => {
			fireEvent.click(getByTestId("StepNavigation__continue-button"));
		});

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		await findByTestId("TransactionSuccessful");

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

	it("should send a vote transaction with a ledger wallet", async () => {
		jest.useFakeTimers();

		const isLedgerSpy = jest.spyOn(wallet, "isLedger").mockImplementation(() => true);

		const getPublicKeySpy = jest
			.spyOn(wallet.coin().ledger(), "getPublicKey")
			.mockResolvedValue("0335a27397927bfa1704116814474d39c2b933aabb990e7226389f022886e48deb");

		const signTransactionSpy = jest
			.spyOn(wallet.transaction(), "signVote")
			.mockReturnValue(Promise.resolve(voteFixture.data.id));

		const voteTransactionMock = createVoteTransactionMock(wallet);

		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [voteFixture.data.id],
			errors: {},
			rejected: [],
		});

		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const unvotes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[1].address,
			},
		];

		appendParameters(parameters, "unvote", unvotes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<LedgerProvider transport={transport}>
					<SendVote />
				</LedgerProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[1].username));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

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

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

		await act(async () => {
			fireEvent.click(getByTestId("StepNavigation__continue-button"));
		});

		act(() => {
			jest.advanceTimersByTime(1000);
		});

		await findByTestId("TransactionSuccessful");

		getPublicKeySpy.mockRestore();
		signTransactionSpy.mockRestore();
		isLedgerSpy.mockRestore();
		broadcastMock.mockRestore();
		voteTransactionMock.mockRestore();
		mockWalletData.mockRestore();
	});

	it("should send a vote transaction using encryption password", async () => {
		jest.useRealTimers();

		const actsWithMnemonicMock = jest.spyOn(wallet, "actsWithMnemonic").mockReturnValue(false);
		const actsWithWifWithEncryptionMock = jest.spyOn(wallet, "actsWithWifWithEncryption").mockReturnValue(true);
		const wifGetMock = jest.spyOn(wallet.signingKey(), "get").mockReturnValue(passphrase);

		const history = createMemoryHistory();
		const voteURL = `/profiles/${fixtureProfileId}/wallets/${wallet.id()}/send-vote`;

		const parameters = new URLSearchParams();

		const votes: VoteDelegateProperties[] = [
			{
				amount: 10,
				delegateAddress: delegateData[0].address,
			},
		];

		appendParameters(parameters, "vote", votes);

		history.push({
			pathname: voteURL,
			search: `?${parameters}`,
		});

		const { result: form } = renderHook(() =>
			useForm({
				defaultValues: {
					fee: "0.1",
				},
			}),
		);

		const { getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/wallets/:walletId/send-vote">
				<FormProvider {...form.current}>
					<LedgerProvider transport={transport}>
						<SendVote />
					</LedgerProvider>
				</FormProvider>
			</Route>,
			{
				history,
				routes: [voteURL],
			},
		);

		expect(getByTestId("SendVote__form-step")).toBeInTheDocument();

		await waitFor(() => expect(getByTestId("SendVote__form-step")).toHaveTextContent(delegateData[0].username));

		await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());
		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// Review Step
		expect(getByTestId("SendVote__review-step")).toBeInTheDocument();

		fireEvent.click(getByTestId("StepNavigation__continue-button"));

		// AuthenticationStep
		expect(getByTestId("AuthenticationStep")).toBeInTheDocument();

		const signMock = jest
			.spyOn(wallet.transaction(), "signVote")
			.mockReturnValue(Promise.resolve(voteFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [voteFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createVoteTransactionMock(wallet);

		const passwordInput = getByTestId("AuthenticationStep__encryption-password");
		fireEvent.input(passwordInput, { target: { value: "password" } });

		await waitFor(() => expect(passwordInput).toHaveValue("password"));

		await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());

		await act(async () => {
			fireEvent.click(getByTestId("StepNavigation__send-button"));
		});

		await findByTestId("TransactionSuccessful", undefined, { timeout: 4000 });

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
		actsWithMnemonicMock.mockRestore();
		actsWithWifWithEncryptionMock.mockRestore();
		wifGetMock.mockRestore();
	});
});
