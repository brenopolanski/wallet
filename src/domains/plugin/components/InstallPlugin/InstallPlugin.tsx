import { Contracts } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Modal } from "app/components/Modal";
import { TabPanel, Tabs } from "app/components/Tabs";
import { toasts } from "app/services";
import { ipcRenderer } from "electron";
import { usePluginManagerContext } from "plugins/context/PluginManagerProvider";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import tw, { styled } from "twin.macro";
import { assertString } from "utils/assertions";

import { FirstStep } from "./Step1";
import { SecondStep } from "./Step2";
import { ThirdStep } from "./Step3";

interface InstallPluginProperties {
	isOpen: boolean;
	onClose?: () => void;
	onCancel?: () => void;
	plugin?: any;
	repositoryURL?: string;
	profile: Contracts.IProfile;
}

enum Step {
	PermissionsStep = 1,
	DownloadStep,
	EnableStep,
}

const ButtonWrapper = styled.div`
	${tw`flex justify-end mt-8 space-x-3`}
`;

export const InstallPlugin = ({
	isOpen,
	onClose,
	onCancel,
	plugin,
	profile,
	repositoryURL,
}: InstallPluginProperties) => {
	const { t } = useTranslation();
	const { downloadPlugin, installPlugin, trigger, pluginManager } = usePluginManagerContext();
	const [activeStep, setActiveStep] = useState<Step>(Step.PermissionsStep);
	const [downloadProgress, setDownloadProgress] = useState<any>({ totalBytes: 0 });
	const [downloadResult, setDownloadResult] = useState<any>();
	const profileId = profile.id();

	const handleInstall = useCallback(
		async (result: any) => {
			try {
				await installPlugin(result?.savedPath, plugin.id, profileId, result?.subDirectory);
				setActiveStep(Step.EnableStep);
			} catch (error) {
				/* istanbul ignore next */
				toasts.error(
					t("PLUGINS.MODAL_INSTALL_PLUGIN.INSTALL_FAILURE", { msg: error.message, name: plugin.title }),
				);
				onClose?.();
			}
		},
		[installPlugin, plugin, profileId, t, onClose],
	);

	const handleDownload = useCallback(async () => {
		setActiveStep(Step.DownloadStep);
		let result: any;
		let downloadFailure = false;

		try {
			result = await downloadPlugin(plugin, repositoryURL);
			setDownloadResult(result);
		} catch {
			downloadFailure = true;
			toasts.error(t("PLUGINS.MODAL_INSTALL_PLUGIN.DOWNLOAD_FAILURE", { name: plugin.title }));
			onClose?.();
		}

		if (!downloadFailure) {
			assertString(result?.savedPath);

			await handleInstall(result);
		}
	}, [handleInstall, downloadPlugin, plugin, repositoryURL, t, onClose]);

	const handleEnable = useCallback(() => {
		try {
			pluginManager.plugins().findById(plugin.id)?.enable(profile, { autoRun: true });
			trigger();

			toasts.success(t("PLUGINS.ENABLE_SUCCESS", { name: plugin.title }));
		} catch (error) {
			toasts.error(t("PLUGINS.ENABLE_FAILURE", { msg: error.message, name: plugin.title }));
		} finally {
			onClose?.();
		}
	}, [pluginManager, plugin, profile, trigger, t, onClose]);

	const onModalClose = () => {
		if (activeStep === Step.EnableStep) {
			ipcRenderer.invoke("plugin:cancel-install", { savedPath: downloadResult.savedPath });
			setActiveStep(Step.PermissionsStep);
			setDownloadResult(undefined);
		}

		onClose?.();
	};

	useEffect(() => {
		// @ts-ignore
		const listener = (_, value: any) => setDownloadProgress(value);
		ipcRenderer.on("plugin:download-progress", listener);

		return () => {
			ipcRenderer.removeListener("plugin:download-progress", listener);
		};
	}, []);

	const renderModalTitle = () => {
		switch (activeStep) {
			case Step.PermissionsStep:
				return t("COMMON.PERMISSIONS");
			case Step.DownloadStep:
				return t("COMMON.DOWNLOADING");
			case Step.EnableStep:
				return t("PLUGINS.SUCCESSFULLY_INSTALLED");
		}
	};

	return (
		<Modal title={renderModalTitle()} size="lg" isOpen={isOpen} onClose={onModalClose}>
			<Tabs activeId={activeStep}>
				<TabPanel tabId={Step.PermissionsStep}>
					<FirstStep plugin={plugin} />
				</TabPanel>

				<TabPanel tabId={Step.DownloadStep}>
					<SecondStep plugin={plugin} downloadProgress={downloadProgress} />
				</TabPanel>

				<TabPanel tabId={Step.EnableStep}>
					<ThirdStep plugin={plugin} />
				</TabPanel>

				{activeStep === Step.PermissionsStep && (
					<ButtonWrapper>
						<Button variant="secondary" onClick={onCancel} data-testid="InstallPlugin__cancel-button">
							{t("COMMON.CANCEL")}
						</Button>
						<Button onClick={handleDownload} data-testid="InstallPlugin__allow-button">
							{t("PLUGINS.MODAL_INSTALL_PLUGIN.ALLOW")}
						</Button>
					</ButtonWrapper>
				)}

				{activeStep === Step.EnableStep && (
					<ButtonWrapper>
						<Button
							variant="secondary"
							onClick={() => {
								ipcRenderer.invoke("plugin:cancel-install", { savedPath: downloadResult.savedPath });
								setActiveStep(Step.PermissionsStep);
								setDownloadResult(undefined);

								onCancel?.();
							}}
							data-testid="InstallPlugin__cancel-button"
						>
							{t("COMMON.CANCEL")}
						</Button>

						<Button onClick={handleEnable} data-testid="InstallPlugin__enable-button">
							{t("COMMON.ENABLE")}
						</Button>
					</ButtonWrapper>
				)}
			</Tabs>
		</Modal>
	);
};
