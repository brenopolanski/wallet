import { Services } from "@payvo/sdk";
import { Contracts, DTO } from "@payvo/sdk-profiles";
import { Form } from "app/components/Form";
import { Page, Section } from "app/components/Layout";
import { StepIndicator } from "app/components/StepIndicator";
import { StepNavigation } from "app/components/StepNavigation";
import { TabPanel, Tabs } from "app/components/Tabs";
import { useEnvironmentContext, useLedgerContext } from "app/contexts";
import { useActiveProfile, useActiveWallet, useValidation } from "app/hooks";
import { useKeydown } from "app/hooks/use-keydown";
import { AuthenticationStep } from "domains/transaction/components/AuthenticationStep";
import { ErrorStep } from "domains/transaction/components/ErrorStep";
import { FeeWarning } from "domains/transaction/components/FeeWarning";
import { useFeeConfirmation, useTransactionBuilder } from "domains/transaction/hooks";
import { handleBroadcastError } from "domains/transaction/utils";
import { useVoteQueryParameters } from "domains/vote/hooks/use-vote-query-parameters";
import { appendParameters } from "domains/vote/utils/url-parameters";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";
import { assertProfile, assertWallet } from "utils/assertions";

import { FormStep } from "./FormStep";
import { VoteLedgerReview } from "./LedgerReview";
import { ReviewStep } from "./ReviewStep";
import { SummaryStep } from "./SummaryStep";

enum Step {
	FormStep = 1,
	ReviewStep,
	AuthenticationStep,
	SummaryStep,
	ErrorStep,
}

export const SendVote = () => {
	const { env, persist } = useEnvironmentContext();
	const history = useHistory();
	const activeProfile = useActiveProfile();
	assertProfile(activeProfile);

	const activeWallet = useActiveWallet();

	const networks = useMemo(() => env.availableNetworks(), [env]);

	const { voteDelegates, unvoteDelegates } = useVoteQueryParameters();

	const [activeTab, setActiveTab] = useState<Step>(Step.FormStep);
	const [unvotes, setUnvotes] = useState<Contracts.VoteRegistryItem[]>([]);
	const [votes, setVotes] = useState<Contracts.VoteRegistryItem[]>([]);
	const [transaction, setTransaction] = useState(null as unknown as DTO.ExtendedSignedTransactionData);
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const form = useForm({ mode: "onChange" });

	const { hasDeviceAvailable, isConnected } = useLedgerContext();
	const { clearErrors, formState, getValues, handleSubmit, register, setValue, watch } = form;
	const { isDirty, isValid, isSubmitting } = formState;

	const { fee, fees } = watch();
	const { sendVote, common } = useValidation();

	const abortReference = useRef(new AbortController());
	const transactionBuilder = useTransactionBuilder();

	useEffect(() => {
		register("network", sendVote.network());
		register("senderAddress", sendVote.senderAddress());
		register("fees");
		register("fee", common.fee(activeWallet.balance(), activeWallet.network(), fees));
		register("inputFeeSettings");

		setValue("senderAddress", activeWallet.address(), { shouldDirty: true, shouldValidate: true });

		register("suppressWarning");

		for (const network of networks) {
			if (network.coin() === activeWallet.coinId() && network.id() === activeWallet.networkId()) {
				setValue("network", network, { shouldDirty: true, shouldValidate: true });

				break;
			}
		}
	}, [activeWallet, networks, register, setValue, common, getValues, sendVote, fees]);

	const { dismissFeeWarning, feeWarningVariant, requireFeeConfirmation, showFeeWarning, setShowFeeWarning } =
		useFeeConfirmation(fee, fees);

	useEffect(() => {
		if (unvoteDelegates.length > 0 && unvotes.length === 0) {
			const unvotesList: Contracts.VoteRegistryItem[] = unvoteDelegates?.map((unvote) => ({
				amount: unvote.amount,
				wallet: env
					.delegates()
					.findByAddress(activeWallet.coinId(), activeWallet.networkId(), unvote.delegateAddress),
			}));

			setUnvotes(unvotesList);
		}
	}, [activeWallet, env, unvoteDelegates, unvotes]);

	useEffect(() => {
		if (voteDelegates.length > 0 && votes.length === 0) {
			const votesList: Contracts.VoteRegistryItem[] = voteDelegates?.map((vote) => ({
				amount: vote.amount,
				wallet: env
					.delegates()
					.findByAddress(activeWallet.coinId(), activeWallet.networkId(), vote.delegateAddress),
			}));

			setVotes(votesList);
		}
	}, [activeWallet, env, voteDelegates, votes]);

	useKeydown("Enter", () => {
		const isButton = (document.activeElement as any)?.type === "button";

		if (isButton || isNextDisabled || activeTab >= Step.AuthenticationStep) {
			return;
		}

		return handleNext();
	});

	const handleBack = () => {
		// Abort any existing listener
		abortReference.current.abort();

		if (activeTab === Step.FormStep) {
			const parameters = new URLSearchParams();

			appendParameters(parameters, "unvote", unvoteDelegates);

			appendParameters(parameters, "vote", voteDelegates);

			return history.push({
				pathname: `/profiles/${activeProfile.id()}/wallets/${activeWallet.id()}/votes`,
				search: `?${parameters}`,
			});
		}

		setActiveTab(activeTab - 1);
	};

	const handleNext = (suppressWarning?: boolean) => {
		abortReference.current = new AbortController();

		const newIndex = activeTab + 1;

		if (newIndex === Step.AuthenticationStep && requireFeeConfirmation && !suppressWarning) {
			return setShowFeeWarning(true);
		}

		const { network, senderAddress } = getValues();
		const senderWallet = activeProfile.wallets().findByAddressWithNetwork(senderAddress, network.id());
		assertWallet(senderWallet);

		// Skip authorization step
		if (newIndex === Step.AuthenticationStep && senderWallet.isMultiSignature()) {
			void handleSubmit(submitForm)();
			return;
		}

		if (newIndex === Step.AuthenticationStep && senderWallet.isLedger()) {
			void handleSubmit(submitForm)();
		}

		setActiveTab(newIndex);
	};

	const confirmSendVote = (type: "unvote" | "vote" | "combined") =>
		new Promise((resolve) => {
			const interval = setInterval(async () => {
				let isConfirmed = false;

				await activeWallet.synchroniser().votes();
				const walletVotes = activeWallet.voting().current();

				if (type === "vote") {
					isConfirmed = !!walletVotes.find(({ wallet }) => wallet?.address() === votes[0].wallet?.address());
				}

				if (type === "unvote") {
					isConfirmed = !walletVotes.find(({ wallet }) => wallet?.address() === unvotes[0].wallet?.address());
				}

				if (type === "combined") {
					const voteConfirmed = !!walletVotes.find(
						({ wallet }) => wallet?.address() === votes[0].wallet?.address(),
					);
					const unvoteConfirmed = !walletVotes.find(
						({ wallet }) => wallet?.address() === unvotes[0].wallet?.address(),
					);

					isConfirmed = voteConfirmed && unvoteConfirmed;
				}

				/* istanbul ignore else */
				if (isConfirmed) {
					clearInterval(interval);
					resolve("");
				}
			}, 1000);
		});

	const submitForm = async () => {
		clearErrors("mnemonic");
		const {
			fee,
			mnemonic,
			network,
			senderAddress,
			secondMnemonic,
			encryptionPassword,
			wif,
			privateKey,
			secret,
			secondSecret,
		} = getValues();
		const abortSignal = abortReference.current?.signal;

		try {
			const signatory = await activeWallet.signatoryFactory().make({
				encryptionPassword,
				mnemonic,
				privateKey,
				secondMnemonic,
				secondSecret,
				secret,
				wif,
			});

			const voteTransactionInput: Services.TransactionInput = {
				fee: +fee,
				signatory,
			};

			const senderWallet = activeProfile.wallets().findByAddressWithNetwork(senderAddress, network.id());

			assertWallet(senderWallet);

			if (unvotes.length > 0 && votes.length > 0) {
				if (senderWallet.network().votingMethod() === "simple") {
					const { uuid, transaction } = await transactionBuilder.build(
						"vote",
						{
							...voteTransactionInput,
							data: {
								unvotes: unvotes.map((unvote) => ({
									amount: unvote.amount,
									id: unvote.wallet?.governanceIdentifier(),
								})),
								votes: votes.map((vote) => ({
									amount: vote.amount,
									id: vote.wallet?.governanceIdentifier(),
								})),
							},
						},
						senderWallet,
						{ abortSignal },
					);

					const voteResponse = await activeWallet.transaction().broadcast(uuid);

					handleBroadcastError(voteResponse);

					await activeWallet.transaction().sync();

					await persist();

					setTransaction(transaction);

					setActiveTab(Step.SummaryStep);

					await confirmSendVote("combined");
				}

				if (senderWallet.network().votingMethod() === "split") {
					const unvoteResult = await transactionBuilder.build(
						"vote",
						{
							...voteTransactionInput,
							data: {
								unvotes: unvotes.map((unvote) => ({
									amount: unvote.amount,
									id: unvote.wallet?.governanceIdentifier(),
								})),
							},
						},
						senderWallet,
						{ abortSignal },
					);

					const unvoteResponse = await activeWallet.transaction().broadcast(unvoteResult.uuid);

					handleBroadcastError(unvoteResponse);

					await activeWallet.transaction().sync();

					await persist();

					await confirmSendVote("unvote");

					const voteResult = await transactionBuilder.build(
						"vote",
						{
							...voteTransactionInput,
							data: {
								votes: votes.map((vote) => ({
									amount: vote.amount,
									id: vote.wallet?.governanceIdentifier(),
								})),
							},
						},
						senderWallet,
						{ abortSignal },
					);

					const voteResponse = await activeWallet.transaction().broadcast(voteResult.uuid);

					handleBroadcastError(voteResponse);

					await activeWallet.transaction().sync();

					await persist();

					setTransaction(voteResult.transaction);

					setActiveTab(Step.SummaryStep);

					await confirmSendVote("vote");
				}
			} else {
				const isUnvote = unvotes.length > 0;
				const { uuid, transaction } = await transactionBuilder.build(
					"vote",
					{
						...voteTransactionInput,
						data: isUnvote
							? {
									unvotes: unvotes.map((unvote) => ({
										amount: unvote.amount,
										id: unvote.wallet?.governanceIdentifier(),
									})),
							  }
							: {
									votes: votes.map((vote) => ({
										amount: vote.amount,
										id: vote.wallet?.governanceIdentifier(),
									})),
							  },
					},
					senderWallet,
					{ abortSignal },
				);

				const response = await activeWallet.transaction().broadcast(uuid);

				handleBroadcastError(response);

				await activeWallet.transaction().sync();

				await persist();

				setTransaction(transaction);

				setActiveTab(Step.SummaryStep);

				await confirmSendVote(isUnvote ? "unvote" : "vote");
			}
		} catch (error) {
			setErrorMessage(JSON.stringify({ message: error.message, type: error.name }));
			setActiveTab(Step.ErrorStep);
		}
	};

	const hideStepNavigation =
		activeTab === Step.ErrorStep || (activeTab === Step.AuthenticationStep && activeWallet.isLedger());

	const isNextDisabled = isDirty ? !isValid : true;

	return (
		<Page>
			<Section className="flex-1">
				<Form className="mx-auto max-w-xl" context={form} onSubmit={submitForm}>
					<Tabs activeId={activeTab}>
						<StepIndicator size={4} activeIndex={activeTab} />

						<div className="mt-8">
							<TabPanel tabId={Step.FormStep}>
								<FormStep
									profile={activeProfile}
									unvotes={unvotes}
									votes={votes}
									wallet={activeWallet}
								/>
							</TabPanel>

							<TabPanel tabId={Step.ReviewStep}>
								<ReviewStep unvotes={unvotes} votes={votes} wallet={activeWallet} />
							</TabPanel>

							<TabPanel tabId={Step.AuthenticationStep}>
								<AuthenticationStep
									wallet={activeWallet}
									ledgerDetails={
										<VoteLedgerReview wallet={activeWallet} votes={votes} unvotes={unvotes} />
									}
									ledgerIsAwaitingDevice={!hasDeviceAvailable}
									ledgerIsAwaitingApp={hasDeviceAvailable && !isConnected}
								/>
							</TabPanel>

							<TabPanel tabId={Step.SummaryStep}>
								<SummaryStep
									wallet={activeWallet}
									transaction={transaction}
									unvotes={unvotes}
									votes={votes}
								/>
							</TabPanel>

							<TabPanel tabId={Step.ErrorStep}>
								<ErrorStep
									onBack={() =>
										history.push(`/profiles/${activeProfile.id()}/wallets/${activeWallet.id()}`)
									}
									isRepeatDisabled={isSubmitting}
									onRepeat={handleSubmit(submitForm)}
									errorMessage={errorMessage}
								/>
							</TabPanel>

							{!hideStepNavigation && (
								<StepNavigation
									onBackClick={handleBack}
									onBackToWalletClick={() =>
										history.push(`/profiles/${activeProfile.id()}/wallets/${activeWallet.id()}`)
									}
									onContinueClick={() => handleNext()}
									isLoading={isSubmitting}
									isNextDisabled={isNextDisabled}
									size={4}
									activeIndex={activeTab}
								/>
							)}
						</div>
					</Tabs>

					<FeeWarning
						isOpen={showFeeWarning}
						variant={feeWarningVariant}
						onCancel={(suppressWarning: boolean) => dismissFeeWarning(handleBack, suppressWarning)}
						onConfirm={(suppressWarning: boolean) =>
							dismissFeeWarning(() => handleNext(true), suppressWarning)
						}
					/>
				</Form>
			</Section>
		</Page>
	);
};
