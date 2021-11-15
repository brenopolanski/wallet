import { Contracts, DTO } from "@payvo/sdk-profiles";
import { Form } from "app/components/Form";
import { Modal } from "app/components/Modal";
import { TabPanel, Tabs } from "app/components/Tabs";
import { useEnvironmentContext, useLedgerContext } from "app/contexts";
import { useLedgerModelStatus } from "app/hooks";
import { AuthenticationStep } from "domains/transaction/components/AuthenticationStep";
import { ErrorStep } from "domains/transaction/components/ErrorStep";
import { useMultiSignatureRegistration, useMultiSignatureStatus } from "domains/transaction/hooks";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { MultiSignatureDetailStep, Paginator } from "./MultiSignatureDetail.helpers";
import { SentStep } from "./SentStep";
import { SummaryStep } from "./SummaryStep";

interface MultiSignatureDetailProperties {
	isOpen: boolean;
	profile: Contracts.IProfile;
	wallet: Contracts.IReadWriteWallet;
	transaction: DTO.ExtendedSignedTransactionData;
	onClose?: () => void;
}

export const MultiSignatureDetail = ({
	isOpen,
	wallet,
	profile,
	transaction,
	onClose,
}: MultiSignatureDetailProperties) => {
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [activeTransaction, setActiveTransaction] = useState<DTO.ExtendedSignedTransactionData>(transaction);

	const { persist } = useEnvironmentContext();
	const { hasDeviceAvailable, isConnected, connect, transport, ledgerDevice } = useLedgerContext();

	const { isLedgerModelSupported } = useLedgerModelStatus({
		connectedModel: ledgerDevice?.id,
		supportedModels: [Contracts.WalletLedgerModel.NanoX],
	});

	const form = useForm({ mode: "onChange" });
	const { handleSubmit, formState } = form;
	const { isValid, isSubmitting } = formState;

	const [activeStep, setActiveStep] = useState<MultiSignatureDetailStep>(MultiSignatureDetailStep.SummaryStep);

	const { addSignature, broadcast } = useMultiSignatureRegistration();
	const { canBeBroadcasted, canBeSigned, isAwaitingFinalSignature } = useMultiSignatureStatus({
		transaction,
		wallet,
	});

	const broadcastMultiSignature = useCallback(async () => {
		try {
			const broadcastedTransaction = await broadcast({ transactionId: transaction.id(), wallet });
			setActiveTransaction(broadcastedTransaction);

			await persist();
			setActiveStep(MultiSignatureDetailStep.SentStep);
		} catch (error) {
			setErrorMessage(JSON.stringify({ message: error.message, type: error.name }));
			setActiveStep(MultiSignatureDetailStep.ErrorStep);
		}
	}, [wallet, transaction, persist, broadcast]);

	const sendSignature = useCallback(
		async ({
			encryptionPassword,
			mnemonic,
			privateKey,
			secondMnemonic,
			secondSecret,
			secret,
			wif,
		}: Contracts.SignatoryInput) => {
			try {
				if (wallet.isLedger()) {
					await connect(profile, wallet.coinId(), wallet.networkId());
					await wallet.ledger().connect(transport);
				}

				const signatory = await wallet.signatoryFactory().make({
					encryptionPassword,
					mnemonic,
					privateKey,
					secondMnemonic,
					secondSecret,
					secret,
					wif,
				});

				await addSignature({ signatory, transactionId: transaction.id(), wallet });
				await wallet.transaction().sync();

				if (wallet.transaction().canBeBroadcasted(transaction.id())) {
					return broadcastMultiSignature();
				}

				setActiveTransaction(transaction);

				setActiveStep(MultiSignatureDetailStep.SentStep);
				await persist();
			} catch (error) {
				setErrorMessage(JSON.stringify({ message: error.message, type: error.name }));
				setActiveStep(MultiSignatureDetailStep.ErrorStep);
			}
		},
		[transaction, wallet, addSignature, connect, profile, transport, persist, broadcastMultiSignature],
	);

	const handleSend = () => {
		// Broadcast only action. Edge case in case final signature is added but not broadcasted due to error.
		if (canBeBroadcasted && !isAwaitingFinalSignature) {
			return handleSubmit(() => broadcastMultiSignature())();
		}

		setActiveStep(MultiSignatureDetailStep.AuthenticationStep);

		if (wallet.isLedger() && isLedgerModelSupported) {
			handleSubmit((data: any) => sendSignature(data))();
		}
	};

	// Reset ledger authentication steps after reconnecting supported ledger
	useEffect(() => {
		if (activeStep === MultiSignatureDetailStep.AuthenticationStep && wallet.isLedger() && isLedgerModelSupported) {
			handleSubmit((data: any) => sendSignature(data))();
		}
	}, [ledgerDevice]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Modal title={""} isOpen={isOpen} onClose={onClose}>
			<Form context={form} onSubmit={broadcastMultiSignature}>
				<Tabs activeId={activeStep}>
					<TabPanel tabId={MultiSignatureDetailStep.SummaryStep}>
						<SummaryStep wallet={wallet} transaction={activeTransaction} />
					</TabPanel>

					<TabPanel tabId={MultiSignatureDetailStep.AuthenticationStep}>
						<AuthenticationStep
							wallet={wallet}
							ledgerIsAwaitingDevice={!hasDeviceAvailable}
							ledgerIsAwaitingApp={!isConnected}
							ledgerConnectedModel={ledgerDevice?.id}
							ledgerSupportedModels={[Contracts.WalletLedgerModel.NanoX]}
						/>
					</TabPanel>

					<TabPanel tabId={MultiSignatureDetailStep.SentStep}>
						<SentStep
							isBroadcast={canBeSigned && (canBeBroadcasted || isAwaitingFinalSignature)}
							transaction={activeTransaction}
							wallet={wallet}
						/>
					</TabPanel>

					<TabPanel tabId={MultiSignatureDetailStep.ErrorStep}>
						<ErrorStep
							onBack={onClose}
							isRepeatDisabled={isSubmitting}
							onRepeat={broadcastMultiSignature}
							errorMessage={errorMessage}
						/>
					</TabPanel>

					<Paginator
						isCreator={wallet.address() === transaction.sender()}
						activeStep={activeStep}
						canBeSigned={canBeSigned}
						canBeBroadcasted={isAwaitingFinalSignature || canBeBroadcasted}
						onCancel={onClose}
						onSign={handleSend}
						onSend={handleSend}
						onBack={() => setActiveStep(MultiSignatureDetailStep.SummaryStep)}
						onContinue={handleSubmit((data: any) => sendSignature(data))}
						isLoading={
							isSubmitting ||
							(wallet.isLedger() &&
								activeStep === MultiSignatureDetailStep.AuthenticationStep &&
								!isLedgerModelSupported)
						}
						isEnabled={isValid}
						isSubmitting={isSubmitting}
					/>
				</Tabs>
			</Form>
		</Modal>
	);
};
