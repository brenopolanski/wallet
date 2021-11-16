import { Contracts } from "@payvo/sdk-profiles";
import { toasts } from "app/services";
import { ipcRenderer } from "electron";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface DownloadProgress {
	total: number;
	percent: number;
	transferred: number;
}

type DownloadStatus = "idle" | "started" | "completed" | "canceled" | "errored";

enum IpcEvent {
	QUIT_INSTALL = `updater:quit-and-install`,
	CANCEL = `updater:cancel`,
	CHECK_UPDATES = `updater:check-for-updates`,
	DOWNLOAD_UPDATE = `updater:download-update`,
	DOWNLOAD_PROGRESS = `updater:download-progress`,
	UPDATE_DOWNLOADED = `updater:update-downloaded`,
	ERROR = `updater:error`,
}

const downloadProgressDefaults = () => ({
	percent: 0,
	total: 0,
	transferred: 0,
});

export const useUpdater = () => {
	const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>(downloadProgressDefaults());
	const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
	const [updateVersion, setUpdateVersion] = useState<string>();
	const { t } = useTranslation();

	const downloadUpdate = () => {
		setDownloadStatus("started");
		ipcRenderer.invoke(IpcEvent.DOWNLOAD_UPDATE);
	};

	const cancel = () => {
		setDownloadStatus("canceled");
		setDownloadProgress(downloadProgressDefaults());
		ipcRenderer.invoke(IpcEvent.CANCEL);
	};

	const quitInstall = (profile?: Contracts.IProfile) => {
		setDownloadStatus("idle");
		ipcRenderer.invoke(IpcEvent.QUIT_INSTALL);

		if (!profile) {
			return;
		}

		profile
			.notifications()
			.releases()
			.forget(updateVersion as string);
	};

	const notifyForUpdates: any = useCallback(
		async (profile: Contracts.IProfile) => {
			try {
				const { cancellationToken, updateInfo } = await ipcRenderer.invoke(IpcEvent.CHECK_UPDATES);
				const hasNewerVersion = !!cancellationToken;

				if (!hasNewerVersion) {
					return;
				}

				setUpdateVersion(updateInfo.version);
				profile
					.notifications()
					.releases()
					.push({
						action: "update",
						body: `- ${t("COMMON.UPDATE").toLowerCase()} v${updateInfo.version}`,
						meta: { version: updateInfo.version },
						name: t("COMMON.APP_NAME"),
					});
			} catch {
				toasts.error(t("COMMON.FAILED_UPDATE_CHECK"));
			}
		},
		[t],
	);

	useEffect(() => {
		const updateDownloaded = () => {
			setDownloadStatus("completed");
			setDownloadProgress(downloadProgressDefaults());
		};

		const updateDownloadProgress = (_: any, { total, percent, transferred }: any) => {
			setDownloadProgress({ percent, total, transferred });
		};

		ipcRenderer.on(IpcEvent.UPDATE_DOWNLOADED, updateDownloaded);
		ipcRenderer.on(IpcEvent.DOWNLOAD_PROGRESS, updateDownloadProgress);

		return () => {
			ipcRenderer.removeListener(IpcEvent.UPDATE_DOWNLOADED, updateDownloaded);
			ipcRenderer.removeListener(IpcEvent.DOWNLOAD_PROGRESS, updateDownloadProgress);
		};
	}, []);

	return {
		cancel,
		downloadProgress,
		downloadStatus,
		downloadUpdate,
		notifyForUpdates,
		quitInstall,
	};
};
