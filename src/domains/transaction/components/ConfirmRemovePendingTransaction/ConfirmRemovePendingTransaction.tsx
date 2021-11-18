import { DTO } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { Image } from "app/components/Image";
import { Modal } from "app/components/Modal";
import { useTransactionTypes } from "domains/transaction/hooks/use-transaction-types";
import React from "react";
import { useTranslation } from "react-i18next";

interface ConfirmSendTransactionProperties {
	isOpen: boolean;
	onClose?: any;
	onRemove?: (transaction: DTO.ExtendedSignedTransactionData) => void;
	transaction?: DTO.ExtendedSignedTransactionData;
}

export const ConfirmRemovePendingTransaction = ({
	isOpen,
	onClose,
	onRemove,
	transaction,
}: ConfirmSendTransactionProperties) => {
	const { t } = useTranslation();
	const { getLabel } = useTransactionTypes();

	if (!transaction?.type()) {
		return null;
	}

	const typeLabel = getLabel(transaction?.type());
	const typeSuffix = transaction.isMultiSignatureRegistration()
		? t("TRANSACTION.REGISTRATION")
		: t("TRANSACTION.TRANSACTION");

	return (
		<Modal
			title={t("TRANSACTION.MODAL_CONFIRM_REMOVE_PENDING_TRANSACTION.TITLE")}
			isOpen={isOpen}
			onClose={onClose}
			size="lg"
			image={<Image name="DeleteBanner" className="my-8 mx-auto w-64" />}
		>
			<div
				className="my-8 text-theme-secondary-text"
				data-testid={`ConfirmRemovePendingTransaction__${typeLabel}-${typeSuffix}`}
			>
				{t("TRANSACTION.MODAL_CONFIRM_REMOVE_PENDING_TRANSACTION.DESCRIPTION", {
					type: `${typeLabel} ${typeSuffix}`,
				})}
			</div>

			<div className="flex justify-end mt-8 space-x-3">
				<Button variant="secondary" onClick={onClose} data-testid="ConfirmRemovePendingTransaction__cancel">
					{t("COMMON.CANCEL")}
				</Button>

				<Button
					type="submit"
					onClick={() => onRemove?.(transaction)}
					variant="danger"
					data-testid="ConfirmRemovePendingTransaction__remove"
				>
					<Icon name="Trash" />
					<span>{t("COMMON.REMOVE")}</span>
				</Button>
			</div>
		</Modal>
	);
};
