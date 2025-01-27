import { Contracts } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { Image } from "app/components/Image";
import { Modal } from "app/components/Modal";
import { useEnvironmentContext } from "app/contexts";
import { toasts } from "app/services";
import React from "react";
import { useTranslation } from "react-i18next";

interface ResetProfileProperties {
	isOpen: boolean;
	profile: Contracts.IProfile;
	onClose?: () => void;
	onCancel?: () => void;
	onReset?: () => void;
}

export const ResetProfile = ({ isOpen, profile, onClose, onCancel, onReset }: ResetProfileProperties) => {
	const { t } = useTranslation();

	const { persist } = useEnvironmentContext();

	const handleReset = async () => {
		profile.flushSettings();

		await persist();

		toasts.success(t("PROFILE.MODAL_RESET_PROFILE.SUCCESS"));

		onReset?.();
	};

	return (
		<Modal
			title={t("PROFILE.MODAL_RESET_PROFILE.TITLE")}
			image={<Image name="GenericWarning" className="m-auto my-8 w-3/5" />}
			description={t("PROFILE.MODAL_RESET_PROFILE.DESCRIPTION")}
			size="lg"
			isOpen={isOpen}
			onClose={onClose}
		>
			<div className="flex justify-end mt-8 space-x-3">
				<Button variant="secondary" onClick={onCancel} data-testid="ResetProfile__cancel-button">
					{t("COMMON.CANCEL")}
				</Button>

				<Button type="submit" onClick={handleReset} data-testid="ResetProfile__submit-button" variant="danger">
					<Icon name="ArrowRotateRight" />
					<span>{t("COMMON.RESET")}</span>
				</Button>
			</div>
		</Modal>
	);
};
