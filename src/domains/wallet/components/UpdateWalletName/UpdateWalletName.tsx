import { Contracts } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Form, FormField, FormLabel } from "app/components/Form";
import { Input } from "app/components/Input";
import { Modal } from "app/components/Modal";
import { useEnvironmentContext } from "app/contexts";
import { alias } from "domains/wallet/validations";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface UpdateWalletNameProperties {
	onAfterSave: () => void;
	onCancel: () => void;
	profile: Contracts.IProfile;
	wallet: Contracts.IReadWriteWallet;
}

interface UpdateWalletNameState {
	name: string;
}

export const UpdateWalletName = ({ onAfterSave, onCancel, profile, wallet }: UpdateWalletNameProperties) => {
	const getDefaultValues = (): UpdateWalletNameState => ({
		name: wallet.alias() as string,
	});

	const form = useForm<UpdateWalletNameState>({
		defaultValues: getDefaultValues(),
		mode: "onChange",
	});

	const { formState, register } = form;
	const { isValid, errors, isDirty, dirtyFields } = formState;

	const { t } = useTranslation();
	const { persist } = useEnvironmentContext();

	const isChanged = useMemo(() => isDirty && Object.keys(dirtyFields).length > 0, [isDirty, dirtyFields]);

	const aliasValidation = alias({ profile, t, walletAddress: wallet.address() });

	const onSubmit = async ({ name }: UpdateWalletNameState) => {
		wallet.mutator().alias(name);
		await persist();

		onAfterSave();
	};

	return (
		<Modal
			isOpen
			title={t("WALLETS.MODAL_NAME_WALLET.TITLE")}
			description={t("WALLETS.MODAL_NAME_WALLET.DESCRIPTION")}
			size="lg"
			onClose={onCancel}
		>
			<Form context={form as any} onSubmit={onSubmit as any} className="mt-8">
				<FormField name="name">
					<FormLabel>{t("WALLETS.WALLET_NAME")}</FormLabel>
					<div className="relative">
						<Input
							autoFocus
							errorMessage={errors.name?.message}
							isInvalid={!isValid}
							data-testid="UpdateWalletName__input"
							ref={register(aliasValidation)}
						/>
					</div>
				</FormField>

				<div className="flex justify-end mt-8 space-x-3">
					<Button data-testid="UpdateWalletName__cancel" variant="secondary" onClick={onCancel}>
						{t("COMMON.CANCEL")}
					</Button>

					<Button type="submit" data-testid="UpdateWalletName__submit" disabled={!isValid || !isChanged}>
						{t("COMMON.SAVE")}
					</Button>
				</div>
			</Form>
		</Modal>
	);
};
