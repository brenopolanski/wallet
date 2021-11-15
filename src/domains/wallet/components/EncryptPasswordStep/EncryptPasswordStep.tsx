import { Contracts } from "@payvo/sdk-profiles";
import { Alert } from "app/components/Alert";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { InputPassword } from "app/components/Input";
import { useValidation } from "app/hooks";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { assertWallet } from "utils/assertions";

interface EncryptPasswordStepProperties {
	importedWallet?: Contracts.IReadWriteWallet;
}

const SecondInputField = ({ wallet }: { wallet: Contracts.IReadWriteWallet }) => {
	const { t } = useTranslation();
	const { register } = useFormContext();

	assertWallet(wallet);

	if (wallet.actsWithMnemonic()) {
		return (
			<FormField name="secondInput">
				<FormLabel label={t("COMMON.SECOND_MNEMONIC")} />

				<InputPassword
					data-testid="EncryptPassword__second-mnemonic"
					ref={register({
						required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
							field: t("COMMON.SECOND_MNEMONIC"),
						}).toString(),
						validate: async (value) => {
							try {
								await wallet.coin().address().fromMnemonic(value);
								return true;
							} catch {
								return t("WALLETS.PAGE_IMPORT_WALLET.VALIDATION.INVALID_MNEMONIC").toString();
							}
						},
					})}
				/>
			</FormField>
		);
	}

	return (
		<FormField name="secondInput">
			<FormLabel label={t("COMMON.SECOND_SECRET")} />

			<InputPassword
				data-testid="EncryptPassword__second-secret"
				ref={register({
					required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
						field: t("COMMON.SECOND_SECRET"),
					}).toString(),
					validate: async (value) => {
						try {
							await wallet.coin().address().fromSecret(value);
						} catch {
							return t("WALLETS.PAGE_IMPORT_WALLET.VALIDATION.INVALID_SECRET").toString();
						}
					},
				})}
			/>
		</FormField>
	);
};

export const EncryptPasswordStep = ({ importedWallet }: EncryptPasswordStepProperties) => {
	const { t } = useTranslation();
	const { register, watch, trigger, getValues } = useFormContext();
	const { encryptionPassword } = watch();
	const { password } = useValidation();

	useEffect(() => {
		if (getValues("confirmEncryptionPassword")) {
			trigger("confirmEncryptionPassword");
		}
	}, [encryptionPassword, getValues, trigger]);

	const renderSecondInputField = () => {
		if (importedWallet?.hasSyncedWithNetwork() && importedWallet?.isSecondSignature()) {
			return <SecondInputField wallet={importedWallet} />;
		}
	};

	return (
		<section data-testid="EncryptPassword">
			<Header title={t("WALLETS.PAGE_IMPORT_WALLET.ENCRYPT_PASSWORD_STEP.TITLE")} />

			<Alert className="mt-6" variant="warning">
				<Trans i18nKey="WALLETS.PAGE_IMPORT_WALLET.ENCRYPT_PASSWORD_STEP.WARNING" />
			</Alert>

			<div className="pt-6 space-y-6">
				{renderSecondInputField()}

				<FormField name="encryptionPassword">
					<FormLabel label={t("WALLETS.PAGE_IMPORT_WALLET.ENCRYPT_PASSWORD_STEP.PASSWORD_LABEL")} />
					<InputPassword ref={register(password.password())} />
				</FormField>

				<FormField name="confirmEncryptionPassword">
					<FormLabel label={t("WALLETS.PAGE_IMPORT_WALLET.ENCRYPT_PASSWORD_STEP.CONFIRM_PASSWORD_LABEL")} />
					<InputPassword ref={register(password.confirmPassword(encryptionPassword))} />
				</FormField>
			</div>
		</section>
	);
};
