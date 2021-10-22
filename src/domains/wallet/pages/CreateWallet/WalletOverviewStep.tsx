import { Alert } from "app/components/Alert";
import { Button } from "app/components/Button";
import { Clipboard } from "app/components/Clipboard";
import { Divider } from "app/components/Divider";
import { Header } from "app/components/Header";
import { Icon } from "app/components/Icon";
import { toasts } from "app/services";
import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { saveFile } from "utils/electron-utils";

import { MnemonicList } from "../../components/MnemonicList";

export const WalletOverviewStep = () => {
	const { getValues, unregister, watch } = useFormContext();

	// getValues does not get the value of `defaultValues` on first render
	const [defaultMnemonic] = useState(() => watch("mnemonic"));
	const mnemonic = getValues("mnemonic") || defaultMnemonic;

	const [defaultWallet] = useState(() => watch("wallet"));
	const wallet = getValues("wallet") || defaultWallet;

	const { t } = useTranslation();

	useEffect(() => {
		unregister("verification");
	}, [unregister]);

	const handleDownload = async () => {
		const fileName = `${wallet.address()}.txt`;

		try {
			const filePath = await saveFile(mnemonic, fileName, {
				filters: { extensions: ["txt"], name: "Text Document" },
				returnBasename: true,
			});

			if (filePath) {
				toasts.success(
					<Trans
						i18nKey="COMMON.SAVE_FILE.SUCCESS"
						values={{ filePath }}
						components={{ bold: <strong /> }}
					/>,
				);
			}
		} catch (error) {
			toasts.error(t("COMMON.SAVE_FILE.ERROR", { error: error.message }));
		}
	};

	return (
		<section data-testid="CreateWallet__WalletOverviewStep">
			<Header title={t("WALLETS.PAGE_CREATE_WALLET.PASSPHRASE_STEP.TITLE")} />

			<Alert className="mt-6">{t("WALLETS.PAGE_CREATE_WALLET.PASSPHRASE_STEP.WARNING")}</Alert>

			<div className="mt-8 space-y-8">
				<MnemonicList mnemonic={mnemonic} />

				<Divider dashed />

				<div className="flex justify-between items-center">
					<div className="space-y-2">
						<span className="text-lg font-semibold text-theme-secondary-text">
							{t("WALLETS.PAGE_CREATE_WALLET.PASSPHRASE_STEP.COPY_OR_DOWNLOAD.TITLE")}
						</span>
						<p className="text-sm text-theme-secondary-500">
							{t("WALLETS.PAGE_CREATE_WALLET.PASSPHRASE_STEP.COPY_OR_DOWNLOAD.DESCRIPTION")}
						</p>
					</div>

					<Icon name="FrameKey" className="text-black dark:text-theme-secondary-600" size="xl" />
				</div>

				<div className="flex justify-end space-x-3 w-full">
					<Clipboard variant="button" data={mnemonic} data-testid="CreateWallet__copy">
						<Icon name="Copy" />
						<span>{t("COMMON.COPY")}</span>
					</Clipboard>

					<Button
						data-testid="CreateWallet__download"
						variant="secondary"
						className="flex items-center space-x-2"
						onClick={handleDownload}
					>
						<Icon name="ArrowDownBracket" />
						<span>{t("COMMON.DOWNLOAD")}</span>
					</Button>
				</div>

				<Divider dashed />
			</div>
		</section>
	);
};
