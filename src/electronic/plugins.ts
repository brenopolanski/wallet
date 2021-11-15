import decompress from "decompress";
import { BrowserWindow, ipcMain } from "electron";
import { download } from "electron-dl";
import { ensureDirSync } from "fs-extra";
import os from "os";
import path from "path";
import trash from "trash";

import { injectHandler } from "../plugins/loader/fs/loader-fs-handler";

export const setupPlugins = () => {
	const installPath = path.resolve(os.homedir(), ".payvo-wallet", "plugins");
	const downloadPath = path.join(installPath, ".cache");

	ensureDirSync(downloadPath);

	ipcMain.handle("plugin:download", async (_, { url, name }) => {
		const win = BrowserWindow.getFocusedWindow();

		if (!win) {
			return;
		}

		let savedPath: string;

		await download(win, url, {
			directory: downloadPath,
			onProgress: (progress) => win.webContents.send("plugin:download-progress", { ...progress, name }),
			onStarted: (item) => (savedPath = item.getSavePath()),
		});

		return savedPath!;
	});

	ipcMain.handle("plugin:install", async (_, { savedPath, profileId, name, subDirectory }) => {
		const pluginPath = path.join(installPath, profileId, name);

		const options: any = {
			map: (file: any) => {
				file.path = file.path.split("/").slice(1).join("/");

				if (subDirectory) {
					file.path = file.path.replace(`${subDirectory}/`, "");
				}

				return file;
			},
		};

		if (subDirectory) {
			options.filter = (file: any) => file.path.includes(subDirectory);
		}

		await decompress(savedPath, pluginPath, options);

		await trash(savedPath);

		return pluginPath;
	});

	ipcMain.handle("plugin:cancel-install", (_, { savedPath }) => {
		trash(savedPath);
	});

	injectHandler();
};
