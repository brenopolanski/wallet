import { uniq } from "@arkecosystem/utils";
import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { Button } from "app/components/Button";
import { Form } from "app/components/Form";
import { Page, Section } from "app/components/Layout";
import { SyncErrorMessage } from "app/components/ProfileSyncStatusMessage";
import { StepIndicator } from "app/components/StepIndicator";
import { TabPanel, Tabs } from "app/components/Tabs";
import { useEnvironmentContext } from "app/contexts";
import { useQueryParams } from "app/hooks";
import { useActiveProfile } from "app/hooks/env";
import { useKeydown } from "app/hooks/use-keydown";
import { toasts } from "app/services";
import { useWalletConfig } from "domains/dashboard/hooks";
import { EncryptPasswordStep } from "domains/wallet/components/EncryptPasswordStep";
import { NetworkStep } from "domains/wallet/components/NetworkStep";
import { UpdateWalletName } from "domains/wallet/components/UpdateWalletName";
import { useWalletImport, WalletGenerationInput } from "domains/wallet/hooks/use-wallet-import";
import { useWalletSync } from "domains/wallet/hooks/use-wallet-sync";
import { getDefaultAlias } from "domains/wallet/utils/get-default-alias";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { assertString, assertWallet } from "utils/assertions";

import { LedgerTabs } from "./Ledger/LedgerTabs";
import { SecondStep } from "./Step2";
import { ThirdStep } from "./Step3";

enum Step {
	NetworkStep = 1,
	MethodStep,
	EncryptPasswordStep,
	SummaryStep,
}

export const ImportWallet = () => {
	const [activeTab, setActiveTab] = useState<Step>(Step.NetworkStep);
	const [importedWallet, setImportedWallet] = useState<Contracts.IReadWriteWallet | undefined>(undefined);
	const [walletGenerationInput, setWalletGenerationInput] = useState<WalletGenerationInput>();
	const [secondMnemonicInput, setSecondMnemonicInput] = useState<string>();

	const [isImporting, setIsImporting] = useState(false);
	const [isEncrypting, setIsEncrypting] = useState(false);
	const [isSyncingCoin, setIsSyncingCoin] = useState(false);
	const [isEditAliasModalOpen, setIsEditAliasModalOpen] = useState(false);

	const queryParameters = useQueryParams();
	const isLedgerImport = !!queryParameters.get("ledger");

	const history = useHistory();
	const { env, persist } = useEnvironmentContext();

	const activeProfile = useActiveProfile();

	const { selectedNetworkIds, setValue } = useWalletConfig({ profile: activeProfile });

	const { t } = useTranslation();
	const { importWalletByType } = useWalletImport({ profile: activeProfile });
	const { syncAll } = useWalletSync({ env, profile: activeProfile });

	const form = useForm<any>({ mode: "onChange" });

	const { getValues, formState, register, watch } = form;
	const { isDirty, isSubmitting, isValid } = formState;
	const { value, encryptionPassword, confirmEncryptionPassword, secondMnemonic } = watch();

	useEffect(() => {
		register("network", { required: true });
		register({ name: "type", type: "custom" });
	}, [register]);

	useEffect(() => {
		if (value !== undefined) {
			setWalletGenerationInput(value);
		}
	}, [value, setWalletGenerationInput]);

	useEffect(() => {
		if (secondMnemonic !== undefined) {
			setSecondMnemonicInput(secondMnemonic);
		}
	}, [secondMnemonic, setSecondMnemonicInput]);

	useKeydown("Enter", () => {
		const isButton = (document.activeElement as any)?.type === "button";

		if (!isLedgerImport && !isButton && !isNextDisabled && activeTab <= Step.EncryptPasswordStep) {
			handleNext();
		}
	});

	const handleNext = async () => {
		switch (activeTab) {
			case Step.MethodStep: {
				setIsImporting(true);

				try {
					const { canBeEncrypted } = await importWallet();

					setActiveTab(canBeEncrypted ? Step.EncryptPasswordStep : Step.SummaryStep);
				} catch (error) {
					/* istanbul ignore next */
					toasts.error(error.message);
				} finally {
					setIsImporting(false);
				}

				break;
			}
			case Step.EncryptPasswordStep: {
				setIsEncrypting(true);

				await encryptMnemonics();
				setActiveTab(Step.SummaryStep);

				setIsEncrypting(false);

				break;
			}
			case Step.NetworkStep: {
				// Construct coin before moving to MethodStep.
				// Will be used in import input validations
				const network = getValues("network");
				const coin = activeProfile.coins().set(network.coin(), network.id());

				setIsSyncingCoin(true);

				try {
					toasts.dismiss();
					await coin.__construct();
					setIsSyncingCoin(false);
				} catch {
					const networkName = `${network.coin()} ${network.name()}`;

					setIsSyncingCoin(false);

					return toasts.warning(
						<SyncErrorMessage
							failedNetworkNames={[networkName]}
							onRetry={async () => {
								setIsSyncingCoin(true);
								await toasts.dismiss();
								handleNext();
							}}
						/>,
					);
				}

				setActiveTab(activeTab + 1);

				break;
			}
		}
	};

	const handleBack = () => {
		if (activeTab === Step.NetworkStep) {
			return history.push(`/profiles/${activeProfile.id()}/dashboard`);
		}

		setActiveTab(activeTab - 1);
	};

	const importWallet = async (): Promise<Networks.ImportMethod> => {
		const { network, type, encryptedWif } = getValues();

		const wallet = await importWalletByType({
			encryptedWif,
			network,
			type,
			value: walletGenerationInput!,
		});

		assertWallet(wallet);

		setValue("selectedNetworkIds", uniq([...selectedNetworkIds, wallet.network().id()]));

		wallet.mutator().alias(
			getDefaultAlias({
				network: wallet.network(),
				profile: activeProfile,
			}),
		);

		setImportedWallet(wallet);

		await syncAll(wallet);

		await persist();

		return network.importMethods()[type];
	};

	const encryptMnemonics = async () => {
		assertWallet(importedWallet);
		assertString(walletGenerationInput);

		importedWallet.signingKey().set(walletGenerationInput, encryptionPassword);

		if (secondMnemonicInput) {
			importedWallet.confirmKey().set(secondMnemonicInput, encryptionPassword);
		}

		if (importedWallet.actsWithMnemonic()) {
			importedWallet
				?.data()
				.set(Contracts.WalletData.ImportMethod, Contracts.WalletImportMethod.BIP39.MNEMONIC_WITH_ENCRYPTION);
		}

		if (importedWallet.actsWithSecret()) {
			importedWallet
				?.data()
				.set(Contracts.WalletData.ImportMethod, Contracts.WalletImportMethod.SECRET_WITH_ENCRYPTION);
		}

		await persist();
	};

	const handleFinish = () => {
		assertWallet(importedWallet);

		history.push(`/profiles/${activeProfile.id()}/wallets/${importedWallet.id()}`);
	};

	const isNextDisabled = useMemo(() => {
		if (activeTab < Step.EncryptPasswordStep) {
			return isDirty ? !isValid || isImporting : true;
		}

		if (activeTab === Step.EncryptPasswordStep) {
			return isEncrypting || !isValid || !encryptionPassword || !confirmEncryptionPassword;
		}
	}, [activeTab, confirmEncryptionPassword, encryptionPassword, isDirty, isEncrypting, isImporting, isValid]);

	return (
		<Page profile={activeProfile}>
			<Section className="flex-1">
				<Form
					className="mx-auto max-w-xl"
					context={form}
					onSubmit={handleFinish}
					data-testid="ImportWallet__form"
				>
					{isLedgerImport ? (
						<LedgerTabs
							onClickEditWalletName={
								/* istanbul ignore next */ (wallet: Contracts.IReadWriteWallet) => {
									setImportedWallet(wallet);
									setIsEditAliasModalOpen(true);
								}
							}
						/>
					) : (
						<Tabs activeId={activeTab}>
							<StepIndicator size={4} activeIndex={activeTab} />

							<div className="mt-8">
								<TabPanel tabId={Step.NetworkStep}>
									<NetworkStep
										profile={activeProfile}
										title={t("WALLETS.PAGE_IMPORT_WALLET.NETWORK_STEP.TITLE")}
										subtitle={t("WALLETS.PAGE_IMPORT_WALLET.NETWORK_STEP.SUBTITLE")}
									/>
								</TabPanel>
								<TabPanel tabId={Step.MethodStep}>
									<SecondStep profile={activeProfile} />
								</TabPanel>

								<TabPanel tabId={Step.EncryptPasswordStep}>
									<EncryptPasswordStep />
								</TabPanel>

								<TabPanel tabId={Step.SummaryStep}>
									<ThirdStep
										importedWallet={importedWallet}
										onClickEditAlias={() => setIsEditAliasModalOpen(true)}
									/>
								</TabPanel>

								<div className="flex justify-between mt-8">
									<div>
										{activeTab === Step.EncryptPasswordStep && (
											<Button
												onClick={() => setActiveTab(Step.SummaryStep)}
												disabled={isEncrypting}
												data-testid="ImportWallet__skip-button"
											>
												{t("COMMON.SKIP")}
											</Button>
										)}
									</div>

									<div className="flex justify-end space-x-3">
										{activeTab < Step.EncryptPasswordStep && (
											<Button
												disabled={isImporting}
												variant="secondary"
												onClick={handleBack}
												data-testid="ImportWallet__back-button"
											>
												{t("COMMON.BACK")}
											</Button>
										)}

										{activeTab <= Step.EncryptPasswordStep && (
											<Button
												disabled={isNextDisabled || isSyncingCoin}
												isLoading={isEncrypting || isImporting || isSyncingCoin}
												onClick={handleNext}
												data-testid="ImportWallet__continue-button"
											>
												{t("COMMON.CONTINUE")}
											</Button>
										)}

										{activeTab === Step.SummaryStep && (
											<Button
												disabled={isSubmitting}
												type="submit"
												data-testid="ImportWallet__finish-button"
											>
												{t("COMMON.GO_TO_WALLET")}
											</Button>
										)}
									</div>
								</div>
							</div>
						</Tabs>
					)}
				</Form>

				{!!importedWallet && isEditAliasModalOpen && (
					<UpdateWalletName
						wallet={importedWallet}
						profile={activeProfile}
						onCancel={() => setIsEditAliasModalOpen(false)}
						onAfterSave={() => setIsEditAliasModalOpen(false)}
					/>
				)}
			</Section>
		</Page>
	);
};
