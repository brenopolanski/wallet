import { Contracts, DTO } from "@payvo/sdk-profiles";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface Properties {
	wallet: Contracts.IReadWriteWallet;
	transaction: DTO.ExtendedSignedTransactionData;
}

export interface MultiSignatureStatus {
	value:
		| "isAwaitingOurSignature"
		| "isAwaitingOtherSignatures"
		| "isAwaitingConfirmation"
		| "isMultiSignatureReady"
		| "isAwaitingFinalSignature";
	label: string;
	icon: string;
	className: string;
}

export const useMultiSignatureStatus = ({ wallet, transaction }: Properties) => {
	const { t } = useTranslation();

	const canBeBroadcasted = useMemo(
		() =>
			wallet.transaction().canBeBroadcasted(transaction.id()) &&
			!wallet.transaction().isAwaitingConfirmation(transaction.id()),
		[wallet, transaction],
	);

	const canBeSigned = useMemo(() => {
		try {
			return wallet.transaction().canBeSigned(transaction.id());
		} catch {
			return false;
		}
	}, [wallet, transaction]);

	const status: MultiSignatureStatus = useMemo(() => {
		if (wallet.transaction().isAwaitingOurSignature(transaction.id())) {
			return {
				className: "text-theme-secondary-700",
				icon: "Pencil",
				label: t("TRANSACTION.MULTISIGNATURE.AWAITING_OUR_SIGNATURE"),
				value: "isAwaitingOurSignature",
			};
		}

		if (wallet.transaction().isAwaitingOtherSignatures(transaction.id())) {
			return {
				className: "text-theme-warning-300",
				icon: "ClockPencil",
				// TODO: waiting for i18next.TS will support plurals https://github.com/i18next/i18next/issues/1683
				label: t("TRANSACTION.MULTISIGNATURE.AWAITING_OTHER_SIGNATURE_COUNT" as any, {
					count: wallet.coin().multiSignature().remainingSignatureCount(transaction.data()),
				}),
				value: "isAwaitingOtherSignatures",
			};
		}

		if (wallet.transaction().isAwaitingConfirmation(transaction.id())) {
			return {
				className: "text-theme-warning-300",
				icon: "Clock",
				label: t("TRANSACTION.MULTISIGNATURE.AWAITING_CONFIRMATIONS"),
				value: "isAwaitingConfirmation",
			};
		}

		if (wallet.transaction().canBeBroadcasted(transaction.id())) {
			return {
				className: "text-theme-success-500",
				icon: "DoubleArrowRight",
				label: t("TRANSACTION.MULTISIGNATURE.READY"),
				value: "isMultiSignatureReady",
			};
		}

		return {
			className: "text-theme-success-500",
			icon: "CircleCheckMarkPencil",
			label: t("TRANSACTION.MULTISIGNATURE.AWAITING_FINAL_SIGNATURE"),
			value: "isAwaitingFinalSignature",
		};
	}, [wallet, transaction, t]);

	const isAwaitingFinalSignature = status.value === "isAwaitingFinalSignature";

	return { canBeBroadcasted, canBeSigned, isAwaitingFinalSignature, status };
};
