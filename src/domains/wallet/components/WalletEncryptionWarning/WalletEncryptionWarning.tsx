import { Button } from "app/components/Button";
import { Image } from "app/components/Image";
import { Modal } from "app/components/Modal";
import React from "react";
import { useTranslation } from "react-i18next";

import { WalletEncryptionWarningProperties } from "./WalletEncryptionWarning.contracts";

export const WalletEncryptionWarning: React.FC<WalletEncryptionWarningProperties> = ({
	importType,
	onCancel,
	onConfirm,
}) => {
	const { t } = useTranslation();

	return (
		<Modal
			title={t("WALLETS.MODAL_WALLET_ENCRYPTION.TITLE")}
			image={<Image name="GenericWarning" className="my-8 mx-auto w-64" />}
			description={t("WALLETS.MODAL_WALLET_ENCRYPTION.DESCRIPTION", { importType })}
			size="lg"
			isOpen
			onClose={onCancel}
		>
			<div className="flex justify-end mt-8 space-x-3">
				<Button variant="secondary" onClick={onCancel} data-testid="WalletEncryptionWarning__cancel-button">
					{t("COMMON.CANCEL")}
				</Button>

				<Button
					type="submit"
					onClick={onConfirm}
					variant="primary"
					data-testid="WalletEncryptionWarning__submit-button"
				>
					{t("COMMON.CONTINUE")}
				</Button>
			</div>
		</Modal>
	);
};
