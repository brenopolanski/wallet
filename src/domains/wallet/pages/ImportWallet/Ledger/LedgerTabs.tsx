import { uniq } from "@payvo/helpers";
import { Enums } from "@payvo/sdk";
import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { StepIndicator } from "app/components/StepIndicator";
import { TabPanel, Tabs } from "app/components/Tabs";
import { LedgerData, useLedgerContext } from "app/contexts";
import { useActiveProfile } from "app/hooks";
import { useKeydown } from "app/hooks/use-keydown";
import { useWalletConfig } from "domains/dashboard/hooks";
import { NetworkStep } from "domains/wallet/components/NetworkStep";
import React, { useCallback, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { assertWallet } from "utils/assertions";

import { LedgerConnectionStep } from "./LedgerConnectionStep";
import { LedgerImportStep } from "./LedgerImportStep";
import { LedgerScanStep } from "./LedgerScanStep";
import { LedgerTabsProperties, LedgerTabStep } from "./LedgerTabs.contracts";

const Paginator = ({
	activeIndex,
	isMultiple,
	isNextDisabled,
	isNextLoading,
	onBack,
	onFinish,
	onNext,
	onRetry,
	showRetry,
	size,
}: {
	activeIndex: LedgerTabStep;
	isMultiple: boolean;
	isNextDisabled?: boolean;
	isNextLoading?: boolean;
	onBack: () => void;
	onFinish: () => void;
	onNext: () => void;
	onRetry?: () => void;
	showRetry?: boolean;
	size: number;
}) => {
	const { t } = useTranslation();

	return (
		<div className="flex justify-between mt-10">
			<div>
				{showRetry && (
					<Button variant="secondary" onClick={onRetry} data-testid="Paginator__retry-button">
						<Icon name="ArrowRotateRight" />
						<span>{t("COMMON.RETRY")}</span>
					</Button>
				)}
			</div>

			<div className="flex space-x-3">
				{activeIndex < size && (
					<Button variant="secondary" onClick={onBack} data-testid="Paginator__back-button">
						{t("COMMON.BACK")}
					</Button>
				)}

				{activeIndex < size && (
					<Button
						disabled={isNextDisabled || isNextLoading}
						isLoading={isNextLoading}
						onClick={onNext}
						data-testid="Paginator__continue-button"
					>
						{t("COMMON.CONTINUE")}
					</Button>
				)}

				{activeIndex === size && (
					<Button disabled={isNextDisabled} data-testid="Paginator__finish-button" onClick={onFinish}>
						{isMultiple ? t("COMMON.GO_TO_PORTFOLIO") : t("COMMON.GO_TO_WALLET")}
					</Button>
				)}
			</div>
		</div>
	);
};

export const LedgerTabs = ({
	activeIndex = LedgerTabStep.NetworkStep,
	onClickEditWalletName,
}: LedgerTabsProperties) => {
	const activeProfile = useActiveProfile();

	const history = useHistory();
	const { importLedgerWallets, isBusy } = useLedgerContext();
	const { selectedNetworkIds, setValue } = useWalletConfig({ profile: activeProfile });

	const { t } = useTranslation();

	const { formState, getValues, handleSubmit } = useFormContext();
	const { isValid, isSubmitting } = formState;

	const [importedWallets, setImportedWallets] = useState<LedgerData[]>([]);
	const [activeTab, setActiveTab] = useState<number>(activeIndex);

	const isMultiple = importedWallets.length > 1;

	const [showRetry, setShowRetry] = useState(false);
	const retryFunctionReference = useRef<() => void>();

	const importWallets = useCallback(
		async ({ network, wallets }: any) => {
			setImportedWallets(wallets);
			const coin = activeProfile.coins().set(network.coin(), network.id());
			await importLedgerWallets(wallets, coin, activeProfile);

			setValue("selectedNetworkIds", uniq([...selectedNetworkIds, coin.network().id()]));
		},
		[importLedgerWallets, activeProfile, setValue, selectedNetworkIds],
	);

	const isNextDisabled = isBusy || !isValid;

	useKeydown("Enter", () => {
		const isButton = (document.activeElement as any)?.type === "button";

		if (!isButton && !isNextDisabled && !isSubmitting) {
			if (activeTab < LedgerTabStep.LedgerImportStep) {
				handleNext();
			} else {
				handleFinish();
			}
		}
	});

	const handleNext = useCallback(async () => {
		if (activeTab === LedgerTabStep.LedgerScanStep) {
			await handleSubmit((data: any) => importWallets(data))();
		}

		setActiveTab(activeTab + 1);
	}, [activeTab, handleSubmit, importWallets]);

	const handleBack = () => {
		if (activeTab === LedgerTabStep.NetworkStep) {
			return history.push(`/profiles/${activeProfile.id()}/dashboard`);
		}

		if (activeTab === LedgerTabStep.LedgerScanStep) {
			return setActiveTab(LedgerTabStep.NetworkStep);
		}

		setActiveTab(activeTab - 1);
	};

	const handleRetry = useCallback(
		(callback?: () => void) => {
			retryFunctionReference.current = callback;
			setShowRetry(!!callback);
		},
		[retryFunctionReference, setShowRetry],
	);

	const handleFinish = useCallback(() => {
		if (isMultiple) {
			history.push(`/profiles/${activeProfile.id()}/dashboard`);
			return;
		}

		const importedWallet = activeProfile
			.wallets()
			.findByAddressWithNetwork(importedWallets[0].address, getValues("network").id());

		assertWallet(importedWallet);
		history.push(`/profiles/${activeProfile.id()}/wallets/${importedWallet.id()}`);
	}, [isMultiple, history, activeProfile, getValues, importedWallets]);

	return (
		<Tabs activeId={activeTab}>
			<StepIndicator size={4} activeIndex={activeTab} />

			<div data-testid="LedgerTabs" className="mt-8">
				<TabPanel tabId={LedgerTabStep.NetworkStep}>
					<NetworkStep
						filter={(network) =>
							network.allows(Enums.FeatureFlag.TransactionTransferLedgerS) ||
							network.allows(Enums.FeatureFlag.TransactionTransferLedgerX)
						}
						profile={activeProfile}
						title={t("WALLETS.PAGE_IMPORT_WALLET.NETWORK_STEP.TITLE")}
						subtitle={t("WALLETS.PAGE_IMPORT_WALLET.NETWORK_STEP.SUBTITLE")}
					/>
				</TabPanel>
				<TabPanel tabId={LedgerTabStep.LedgerConnectionStep}>
					<LedgerConnectionStep onConnect={() => setActiveTab(LedgerTabStep.LedgerScanStep)} />
				</TabPanel>
				<TabPanel tabId={LedgerTabStep.LedgerScanStep}>
					<LedgerScanStep profile={activeProfile} setRetryFn={handleRetry} />
				</TabPanel>
				<TabPanel tabId={LedgerTabStep.LedgerImportStep}>
					<LedgerImportStep
						wallets={importedWallets}
						profile={activeProfile}
						onClickEditWalletName={onClickEditWalletName}
					/>
				</TabPanel>
			</div>

			<Paginator
				activeIndex={activeTab}
				isMultiple={isMultiple}
				isNextDisabled={isNextDisabled}
				isNextLoading={isSubmitting}
				onBack={handleBack}
				onFinish={handleFinish}
				onNext={handleNext}
				onRetry={retryFunctionReference.current}
				showRetry={showRetry}
				size={4}
			/>
		</Tabs>
	);
};
