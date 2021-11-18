import { DTO } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import React from "react";
import { useTranslation } from "react-i18next";

export enum MultiSignatureDetailStep {
	SummaryStep = 1,
	AuthenticationStep = 2,
	SentStep = 3,
	ErrorStep = 10,
}

interface PaginatorProperties {
	activeStep: MultiSignatureDetailStep;
	canBeSigned: boolean;
	canBeBroadcasted: boolean;
	onCancel?: () => void;
	onSign?: () => void;
	onSend?: () => void;
	onBack?: () => void;
	onContinue?: () => void;
	isEnabled?: boolean;
	isLoading?: boolean;
	isSubmitting?: boolean;
	isCreator?: boolean;
}

export const Paginator = ({
	activeStep,
	canBeSigned,
	canBeBroadcasted,
	onCancel,
	onSign,
	onSend,
	onBack,
	onContinue,
	isEnabled,
	isLoading,
	isSubmitting,
	isCreator,
}: PaginatorProperties) => {
	const { t } = useTranslation();

	const canAddFinalSignatureAndSend =
		canBeBroadcasted && canBeSigned && activeStep === MultiSignatureDetailStep.SummaryStep;
	const canSign = canBeSigned && !canBeBroadcasted && activeStep === MultiSignatureDetailStep.SummaryStep;
	const canAuthenticate = canBeSigned && activeStep === MultiSignatureDetailStep.AuthenticationStep;
	const canBroadCastOnly =
		canBeBroadcasted && !canBeSigned && isCreator && activeStep === MultiSignatureDetailStep.SummaryStep;

	if (canAuthenticate) {
		return (
			<div className="flex justify-end mt-8 space-x-3">
				<Button data-testid="Paginator__back" variant="secondary" onClick={onBack}>
					{t("COMMON.BACK")}
				</Button>

				<Button
					disabled={!isEnabled || isLoading}
					data-testid="Paginator__continue"
					isLoading={isLoading}
					onClick={onContinue}
				>
					{t("COMMON.CONTINUE")}
				</Button>
			</div>
		);
	}

	if (canSign) {
		return (
			<div className="flex justify-end mt-8 space-x-3">
				<Button data-testid="Paginator__cancel" variant="secondary" onClick={onCancel}>
					{t("COMMON.CANCEL")}
				</Button>
				<Button data-testid="Paginator__sign" onClick={onSign}>
					{t("COMMON.SIGN")}
				</Button>
			</div>
		);
	}

	if (canAddFinalSignatureAndSend || canBroadCastOnly) {
		return (
			<div className="flex justify-end mt-8 space-x-3">
				<Button data-testid="Paginator__cancel" variant="secondary" onClick={onCancel}>
					{t("COMMON.CANCEL")}
				</Button>

				<Button
					onClick={onSend}
					disabled={isSubmitting}
					isLoading={isSubmitting}
					data-testid="MultiSignatureDetail__broadcast"
				>
					{t("COMMON.SEND")}
				</Button>
			</div>
		);
	}

	return null;
};

export const getMultiSignatureInfo = (transaction: DTO.ExtendedSignedTransactionData) => {
	const { min, publicKeys, mandatoryKeys, numberOfSignatures, optionalKeys } = transaction.get<{
		optionalKeys: string[];
		mandatoryKeys: string[];
		publicKeys: string[];
		min: number;
		numberOfSignatures: number;
	}>("multiSignature");

	if (transaction.wallet().network().multiSignatureType() === "advanced") {
		return {
			min: numberOfSignatures,
			publicKeys: [...mandatoryKeys, ...optionalKeys],
		};
	}

	return {
		min,
		publicKeys,
	};
};
