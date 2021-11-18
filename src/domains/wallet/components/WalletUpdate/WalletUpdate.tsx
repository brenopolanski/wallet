import { Contracts } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Image } from "app/components/Image";
import { Modal } from "app/components/Modal";
import { TabPanel, Tabs } from "app/components/Tabs";
import { useUpdater } from "app/hooks/use-updater";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { FirstStep } from "./Step1";
import { SecondStep } from "./Step2";
import { ThirdStep } from "./Step3";

interface WalletUpdateProperties {
	version?: string;
	profile?: Contracts.IProfile;
	isOpen?: boolean;
	onClose?: any;
	onCancel?: any;
}

enum Step {
	InitialStep = 1,
	DownloadStep,
	ReadyToInstallStep,
}

export const WalletUpdate = ({ isOpen = false, onClose, onCancel, version = "", profile }: WalletUpdateProperties) => {
	const [activeStep, setActiveStep] = useState<Step>(Step.InitialStep);

	const { t } = useTranslation();
	const { downloadUpdate, downloadProgress, downloadStatus, cancel, quitInstall } = useUpdater();

	const handleUpdateNow = () => {
		downloadUpdate();
		setActiveStep(Step.DownloadStep);
	};

	const handleInstall = () => {
		quitInstall(profile);
	};

	const handleClose = () => {
		setActiveStep(Step.InitialStep);

		cancel();
		onClose?.();
	};

	const handleCancel = () => {
		onCancel?.();
	};

	useEffect(() => {
		if (downloadStatus === "completed") {
			setActiveStep(Step.ReadyToInstallStep);
		}
	}, [downloadStatus, setActiveStep]);

	return (
		<Modal
			title={t("WALLETS.MODAL_WALLET_UPDATE.TITLE", { version })}
			image={
				activeStep < Step.ReadyToInstallStep ? (
					<Image name="WalletUpdateBanner" domain="wallet" className="my-8" />
				) : (
					<Image name="WalletUpdateReadyBanner" domain="wallet" className="my-8" />
				)
			}
			isOpen={isOpen}
			onClose={handleClose}
		>
			<Tabs activeId={activeStep}>
				<TabPanel tabId={Step.InitialStep}>
					<FirstStep />
				</TabPanel>
				<TabPanel tabId={Step.DownloadStep}>
					<SecondStep {...downloadProgress} />
				</TabPanel>
				<TabPanel tabId={Step.ReadyToInstallStep}>
					<ThirdStep />
				</TabPanel>

				<div className="flex flex-col justify-center space-x-0 sm:flex-row sm:space-x-3">
					{activeStep === Step.InitialStep && (
						<>
							<Button
								variant="secondary"
								className="mt-2 sm:mt-0"
								onClick={handleCancel}
								data-testid="WalletUpdate__cancel-button"
							>
								{t("COMMON.UPDATE_LATER")}
							</Button>
							<Button onClick={handleUpdateNow} data-testid="WalletUpdate__update-button">
								{t("COMMON.UPDATE_NOW")}
							</Button>
						</>
					)}

					{activeStep === Step.ReadyToInstallStep && (
						<Button data-testid="WalletUpdate__install-button" onClick={handleInstall}>
							{t("COMMON.INSTALL")}
						</Button>
					)}
				</div>
			</Tabs>
		</Modal>
	);
};
