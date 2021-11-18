import { Contracts } from "@payvo/sdk-profiles";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { InputPassword } from "app/components/Input";
import { LedgerModel, useLedgerModelStatus, useValidation } from "app/hooks";
import { LedgerConfirmation } from "domains/transaction/components/LedgerConfirmation";
import {
	LedgerDeviceErrorContent,
	LedgerWaitingAppContent,
	LedgerWaitingDeviceContent,
} from "domains/wallet/components/Ledger";
import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export interface LedgerStates {
	ledgerIsAwaitingDevice?: boolean;
	ledgerIsAwaitingApp?: boolean;
	ledgerSupportedModels?: LedgerModel[];
	ledgerConnectedModel?: LedgerModel;
}

const LedgerStateWrapper = ({
	ledgerConnectedModel,
	ledgerIsAwaitingApp,
	ledgerIsAwaitingDevice,
	wallet,
	children,
	ledgerSupportedModels = [Contracts.WalletLedgerModel.NanoS, Contracts.WalletLedgerModel.NanoX],
}: { wallet: Contracts.IReadWriteWallet; children: React.ReactNode } & LedgerStates) => {
	const { t } = useTranslation();

	const { isLedgerModelSupported } = useLedgerModelStatus({
		connectedModel: ledgerConnectedModel,
		supportedModels: ledgerSupportedModels,
	});

	const subtitle = useMemo(() => {
		if (ledgerSupportedModels.length > 1 || !ledgerConnectedModel) {
			return t("WALLETS.MODAL_LEDGER_WALLET.CONNECT_DEVICE");
		}

		const modelNames = {
			[Contracts.WalletLedgerModel.NanoS]: t("WALLETS.MODAL_LEDGER_WALLET.LEDGER_NANO_S"),
			[Contracts.WalletLedgerModel.NanoX]: t("WALLETS.MODAL_LEDGER_WALLET.LEDGER_NANO_X"),
		};

		return t("WALLETS.MODAL_LEDGER_WALLET.CONNECT_DEVICE_MODEL", { model: modelNames[ledgerSupportedModels[0]] });
	}, [ledgerConnectedModel, ledgerSupportedModels, t]);

	if (ledgerConnectedModel && !isLedgerModelSupported) {
		return (
			<LedgerDeviceErrorContent connectedModel={ledgerConnectedModel} supportedModel={ledgerSupportedModels[0]} />
		);
	}

	if (ledgerIsAwaitingDevice) {
		return <LedgerWaitingDeviceContent subtitle={subtitle} />;
	}

	if (ledgerIsAwaitingApp) {
		return <LedgerWaitingAppContent coinName={wallet.network().coin()} subtitle={subtitle} />;
	}

	return <>{children}</>;
};

export const AuthenticationStep = ({
	wallet,
	ledgerDetails,
	ledgerIsAwaitingDevice,
	ledgerIsAwaitingApp,
	ledgerSupportedModels,
	ledgerConnectedModel,
}: {
	wallet: Contracts.IReadWriteWallet;
	ledgerDetails?: React.ReactNode;
} & LedgerStates) => {
	const { t } = useTranslation();
	const { errors, getValues, register } = useFormContext();
	const { authentication } = useValidation();

	if (wallet.isLedger()) {
		return (
			<div data-testid="AuthenticationStep" className="space-y-8">
				<LedgerStateWrapper
					ledgerIsAwaitingApp={ledgerIsAwaitingApp}
					ledgerIsAwaitingDevice={ledgerIsAwaitingDevice}
					ledgerSupportedModels={ledgerSupportedModels}
					ledgerConnectedModel={ledgerConnectedModel}
					wallet={wallet}
				>
					<>
						<Header title={t("TRANSACTION.LEDGER_CONFIRMATION.TITLE")} />

						<LedgerConfirmation>{ledgerDetails}</LedgerConfirmation>
					</>
				</LedgerStateWrapper>
			</div>
		);
	}

	const title = t("TRANSACTION.AUTHENTICATION_STEP.TITLE");

	const requireMnemonic = wallet.actsWithMnemonic() || wallet.actsWithAddress() || wallet.actsWithPublicKey();
	const requireEncryptionPassword =
		wallet.actsWithMnemonicWithEncryption() ||
		wallet.actsWithWifWithEncryption() ||
		wallet.actsWithSecretWithEncryption();

	const requireSecondMnemonic = wallet.isSecondSignature() && requireMnemonic;
	const requireSecondSecret = wallet.isSecondSignature() && wallet.actsWithSecret();

	return (
		<div data-testid="AuthenticationStep" className="space-y-6">
			{wallet.actsWithWif() && (
				<>
					<Header title={title} subtitle={t("TRANSACTION.AUTHENTICATION_STEP.DESCRIPTION_WIF")} />

					<FormField name="wif">
						<FormLabel>{t("COMMON.WIF")}</FormLabel>
						<InputPassword
							data-testid="AuthenticationStep__wif"
							ref={register(authentication.wif(wallet))}
						/>
					</FormField>
				</>
			)}

			{wallet.actsWithPrivateKey() && (
				<>
					<Header title={title} subtitle={t("TRANSACTION.AUTHENTICATION_STEP.DESCRIPTION_PRIVATE_KEY")} />

					<FormField name="privateKey">
						<FormLabel>{t("COMMON.PRIVATE_KEY")}</FormLabel>
						<InputPassword
							data-testid="AuthenticationStep__private-key"
							ref={register(authentication.privateKey(wallet))}
						/>
					</FormField>
				</>
			)}

			{wallet.actsWithSecret() && (
				<>
					<Header title={title} subtitle={t("TRANSACTION.AUTHENTICATION_STEP.DESCRIPTION_SECRET")} />

					<FormField name="secret">
						<FormLabel>{t("COMMON.SECRET")}</FormLabel>
						<InputPassword
							data-testid="AuthenticationStep__secret"
							ref={register(authentication.secret(wallet))}
						/>
					</FormField>
				</>
			)}

			{requireEncryptionPassword && (
				<>
					<Header
						title={title}
						subtitle={t("TRANSACTION.AUTHENTICATION_STEP.DESCRIPTION_ENCRYPTION_PASSWORD")}
					/>

					<FormField name="encryptionPassword">
						<FormLabel>{t("TRANSACTION.ENCRYPTION_PASSWORD")}</FormLabel>
						<InputPassword
							data-testid="AuthenticationStep__encryption-password"
							ref={register(authentication.encryptionPassword(wallet))}
						/>
					</FormField>
				</>
			)}

			{requireMnemonic && (
				<>
					<Header title={title} subtitle={t("TRANSACTION.AUTHENTICATION_STEP.DESCRIPTION_MNEMONIC")} />

					<FormField name="mnemonic">
						<FormLabel>{t("TRANSACTION.MNEMONIC")}</FormLabel>
						<InputPassword
							data-testid="AuthenticationStep__mnemonic"
							ref={register(authentication.mnemonic(wallet))}
						/>
					</FormField>
				</>
			)}

			{requireSecondMnemonic && (
				<FormField name="secondMnemonic">
					<FormLabel>{t("TRANSACTION.SECOND_MNEMONIC")}</FormLabel>
					<InputPassword
						data-testid="AuthenticationStep__second-mnemonic"
						disabled={!getValues("mnemonic") || errors.mnemonic}
						ref={register(authentication.secondMnemonic(wallet.coin(), wallet.secondPublicKey()!))}
					/>
				</FormField>
			)}

			{requireSecondSecret && (
				<FormField name="secondSecret">
					<FormLabel>{t("TRANSACTION.SECOND_SECRET")}</FormLabel>
					<InputPassword
						data-testid="AuthenticationStep__second-secret"
						disabled={!getValues("secret") || errors.secret}
						ref={register(authentication.secondSecret(wallet.coin(), wallet.secondPublicKey()!))}
					/>
				</FormField>
			)}
		</div>
	);
};
