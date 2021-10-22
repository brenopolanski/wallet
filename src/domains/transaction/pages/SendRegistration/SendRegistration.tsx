import { DTO } from "@payvo/profiles";
import { WalletLedgerModel } from "@payvo/profiles/distribution/contracts";
import { Networks } from "@payvo/sdk";
import { Form } from "app/components/Form";
import { Page, Section } from "app/components/Layout";
import { StepIndicator } from "app/components/StepIndicator";
import { StepNavigation } from "app/components/StepNavigation";
import { TabPanel, Tabs } from "app/components/Tabs";
import { useEnvironmentContext, useLedgerContext } from "app/contexts";
import { useActiveProfile, useActiveWallet, useLedgerModelStatus, useValidation } from "app/hooks";
import { useKeydown } from "app/hooks/use-keydown";
import { AuthenticationStep } from "domains/transaction/components/AuthenticationStep";
import {
	DelegateRegistrationForm,
	signDelegateRegistration,
} from "domains/transaction/components/DelegateRegistrationForm";
import { ErrorStep } from "domains/transaction/components/ErrorStep";
import { FeeWarning } from "domains/transaction/components/FeeWarning";
import { MultiSignatureRegistrationForm } from "domains/transaction/components/MultiSignatureRegistrationForm";
import {
	SecondSignatureRegistrationForm,
	signSecondSignatureRegistration,
} from "domains/transaction/components/SecondSignatureRegistrationForm";
import { useFeeConfirmation, useMultiSignatureRegistration, useWalletSignatory } from "domains/transaction/hooks";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";

import { SummaryStep } from ".";
import { SendRegistrationForm } from "./SendRegistration.models";

export const SendRegistration = () => {
	const history = useHistory();

	const [activeTab, setActiveTab] = useState(1);
	const [transaction, setTransaction] = useState((null as unknown) as DTO.ExtendedSignedTransactionData);
	const [registrationForm, setRegistrationForm] = useState<SendRegistrationForm>();
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const { registrationType } = useParams<{ registrationType: string }>();

	const { env } = useEnvironmentContext();
	const activeProfile = useActiveProfile();
	const activeWallet = useActiveWallet();
	const { sign } = useWalletSignatory(activeWallet);
	const { sendMultiSignature, abortReference } = useMultiSignatureRegistration();
	const { common } = useValidation();

	const { hasDeviceAvailable, isConnected, connect, transport, ledgerDevice } = useLedgerContext();

	const { isLedgerModelSupported } = useLedgerModelStatus({
		connectedModel: ledgerDevice?.id,
		supportedModels: [WalletLedgerModel.NanoX],
	});

	const form = useForm({ mode: "onChange" });

	const { formState, register, setValue, watch, getValues } = form;
	const { isDirty, isSubmitting, isValid } = formState;

	const { fee, fees, isLoading } = watch();

	const stepCount = registrationForm ? registrationForm.tabSteps + 2 : 1;
	const authenticationStep = stepCount - 1;
	const isAuthenticationStep = activeTab === authenticationStep;

	useEffect(() => {
		register("fees");
		register("fee", common.fee(activeWallet.balance(), activeWallet.network(), fees));
		register("inputFeeSettings");

		register("network", { required: true });
		register("senderAddress", { required: true });

		register("suppressWarning");
		register("isLoading");
	}, [register, activeWallet, common, fees]);

	const {
		dismissFeeWarning,
		feeWarningVariant,
		requireFeeConfirmation,
		showFeeWarning,
		setShowFeeWarning,
	} = useFeeConfirmation(fee, fees);

	useEffect(() => {
		setValue("senderAddress", activeWallet.address(), { shouldDirty: true, shouldValidate: true });

		const network = env
			.availableNetworks()
			.find(
				(network: Networks.Network) =>
					network.coin() === activeWallet.coinId() && network.id() === activeWallet.networkId(),
			);
		setValue("network", network, { shouldDirty: true, shouldValidate: true });
	}, [activeWallet, env, setValue]);

	useLayoutEffect(() => {
		switch (registrationType) {
			case "secondSignature": {
				return setRegistrationForm(SecondSignatureRegistrationForm);
			}
			case "multiSignature": {
				return setRegistrationForm(MultiSignatureRegistrationForm);
			}
			default: {
				return setRegistrationForm(DelegateRegistrationForm);
			}
		}
	}, [registrationType]);

	// Reset ledger authentication steps after reconnecting supported ledger
	useEffect(() => {
		if (registrationType !== "multiSignature") {
			return;
		}

		if (isAuthenticationStep && activeWallet.isLedger() && isLedgerModelSupported) {
			handleSubmit();
		}
	}, [ledgerDevice]); // eslint-disable-line react-hooks/exhaustive-deps

	useKeydown("Enter", () => {
		const isButton = (document.activeElement as any)?.type === "button";

		if (isButton || isNextDisabled || activeTab >= authenticationStep) {
			return;
		}

		return handleNext();
	});

	const handleSubmit = async () => {
		try {
			const {
				mnemonic,
				secondMnemonic,
				encryptionPassword,
				wif,
				privateKey,
				secret,
				participants,
				minParticipants,
				fee,
			} = getValues();

			if (activeWallet.isLedger()) {
				await connect(activeProfile, activeWallet.coinId(), activeWallet.networkId());
				await activeWallet.ledger().connect(transport);
			}

			const signatory = await sign({
				encryptionPassword,
				mnemonic,
				privateKey,
				/* istanbul ignore next */
				secondMnemonic: registrationType === "secondSignature" ? undefined : secondMnemonic,
				secret,
				wif,
			});

			if (registrationType === "multiSignature") {
				const transaction = await sendMultiSignature({
					fee,
					minParticipants,
					participants,
					signatory,
					wallet: activeWallet,
				});

				await env.persist();
				setTransaction(transaction);
				setActiveTab(stepCount);
				return;
			}

			if (registrationType === "secondSignature") {
				const transaction = await signSecondSignatureRegistration({
					env,
					form,
					profile: activeProfile,
					signatory,
				});

				setTransaction(transaction);
				handleNext();
			}

			if (registrationType === "delegateRegistration") {
				const transaction = await signDelegateRegistration({
					env,
					form,
					profile: activeProfile,
					signatory,
				});

				setTransaction(transaction);
				handleNext();
			}
		} catch (error) {
			setErrorMessage(JSON.stringify({ message: error.message, type: error.name }));
			setActiveTab(10);
		}
	};

	const handleBack = () => {
		// Abort any existing listener
		abortReference.current.abort();

		if (activeTab === 1) {
			return history.push(`/profiles/${activeProfile.id()}/wallets/${activeWallet.id()}`);
		}

		setActiveTab(activeTab - 1);
	};

	const handleNext = (suppressWarning?: boolean) => {
		abortReference.current = new AbortController();

		const nextStep = activeTab + 1;
		const isNextStepAuthentication = nextStep === authenticationStep;

		if (isNextStepAuthentication && requireFeeConfirmation && !suppressWarning) {
			return setShowFeeWarning(true);
		}

		// Skip authentication step
		if (isNextStepAuthentication && activeWallet.isLedger() && isLedgerModelSupported) {
			handleSubmit();
		}

		setActiveTab(nextStep);
	};

	const hideStepNavigation = activeTab === 10 || (isAuthenticationStep && activeWallet.isLedger());

	const isNextDisabled = isDirty ? !isValid || !!isLoading : true;

	return (
		<Page profile={activeProfile}>
			<Section className="flex-1">
				<Form
					data-testid="Registration__form"
					className="mx-auto max-w-xl"
					context={form}
					onSubmit={handleSubmit}
				>
					<Tabs activeId={activeTab}>
						<StepIndicator size={stepCount} activeIndex={activeTab} />

						<div className="mt-8">
							<TabPanel tabId={10}>
								<ErrorStep
									onBack={() =>
										history.push(`/profiles/${activeProfile.id()}/wallets/${activeWallet.id()}`)
									}
									isRepeatDisabled={isSubmitting}
									onRepeat={form.handleSubmit(handleSubmit)}
									errorMessage={errorMessage}
								/>
							</TabPanel>

							{registrationForm && (
								<>
									<registrationForm.component
										activeTab={activeTab}
										wallet={activeWallet}
										profile={activeProfile}
									/>

									<TabPanel tabId={authenticationStep}>
										<AuthenticationStep
											wallet={activeWallet}
											ledgerIsAwaitingDevice={!hasDeviceAvailable}
											ledgerIsAwaitingApp={!isConnected}
											ledgerSupportedModels={[WalletLedgerModel.NanoX]}
											ledgerConnectedModel={ledgerDevice?.id}
										/>
									</TabPanel>

									<TabPanel tabId={stepCount}>
										<SummaryStep
											transaction={transaction}
											registrationForm={registrationForm}
											senderWallet={activeWallet}
										/>
									</TabPanel>
								</>
							)}

							{!hideStepNavigation && (
								<StepNavigation
									onBackClick={handleBack}
									onBackToWalletClick={() =>
										history.push(`/profiles/${activeProfile.id()}/wallets/${activeWallet.id()}`)
									}
									onContinueClick={() => handleNext()}
									isLoading={isSubmitting || isLoading}
									isNextDisabled={isNextDisabled}
									size={stepCount}
									activeIndex={activeTab}
								/>
							)}
						</div>
					</Tabs>

					<FeeWarning
						isOpen={showFeeWarning}
						variant={feeWarningVariant}
						onCancel={(suppressWarning: boolean) =>
							dismissFeeWarning(() => setActiveTab(1), suppressWarning)
						}
						onConfirm={(suppressWarning: boolean) =>
							dismissFeeWarning(() => handleNext(true), suppressWarning)
						}
					/>
				</Form>
			</Section>
		</Page>
	);
};
