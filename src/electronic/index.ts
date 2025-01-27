import { app, BrowserWindow, ipcMain, screen, shell } from "electron";
import isDev from "electron-is-dev";
import winState from "electron-window-state";
import path from "path";

import assignMenu from "./menu";
import { setupPlugins } from "./plugins";
import { setupUpdater } from "./updater";
import { handleSingleInstance } from "./utils/single-instance";

const windows = {};
let mainWindow: BrowserWindow | null;
let windowState = null;
let deeplinkingUrl: string | null;

const winURL = isDev
	? "http://localhost:3000"
	: process.env.ELECTRON_IS_E2E
	? `file://${path.resolve("build/index.html")}`
	: `file://${path.resolve(__dirname, "../")}/index.html`;

const installExtensions = async () => {
	if (isDev) {
		const installer = require("electron-devtools-installer");
		const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
		const extensions = ["REACT_DEVELOPER_TOOLS"];

		return Promise.all(extensions.map((name) => installer.default(installer[name], forceDownload))).catch(
			console.error,
		);
	}
};

function broadcastURL(url: string | null) {
	if (!url || typeof url !== "string") {
		return;
	}

	if (mainWindow && mainWindow.webContents) {
		mainWindow.webContents.send("process-url", url);
		deeplinkingUrl = null;
	}
}

ipcMain.on("disable-iframe-protection", function (_event, urls) {
	const filter = { urls };
	// @ts-ignore
	windows.main.webContents.session.webRequest.onHeadersReceived(filter, (details, done) => {
		const headers = details.responseHeaders;

		// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
		const xFrameOrigin = Object.keys(headers).find((header) => header.toString().match(/^x-frame-options$/i));
		if (xFrameOrigin) {
			delete headers[xFrameOrigin];
		}

		done({
			cancel: false,
			responseHeaders: headers,
			statusLine: details.statusLine,
		});
	});
});

ipcMain.on("exit-app", function () {
	app.quit();
});

ipcMain.on("open-external", function (_event, url) {
	try {
		shell.openExternal(url);
	} catch (error) {
		console.error(error);
	}
});

function createWindow() {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;

	// @ts-ignore
	windowState = winState({
		defaultHeight: height,
		defaultWidth: width,
		fullScreen: false,
	});

	mainWindow = new BrowserWindow({
		backgroundColor: "#f7fafb",
		center: true,
		// @ts-ignore
		height: windowState.height,
		minHeight: 600,
		minWidth: 1024,
		show: true,
		webPreferences: {
			contextIsolation: false,

			// TODO: remove remote module. See more at https://nornagon.medium.com/electrons-remote-module-considered-harmful-70d69500f31
			enableRemoteModule: true,

			nodeIntegration: true,

			// See more on multithreading: https://www.electronjs.org/docs/tutorial/multithreading
			nodeIntegrationInWorker: true,

			webviewTag: true,
		},
		// @ts-ignore
		width: windowState.width,
		// @ts-ignore
		x: windowState.x,
		// @ts-ignore
		y: windowState.y,
	});

	// @ts-ignore
	windowState.manage(mainWindow);
	mainWindow.loadURL(winURL);
	mainWindow.setBackgroundColor("#f7fafb");
	mainWindow.setContentProtection(!isDev);

	mainWindow.on("close", () => (mainWindow = null));
	mainWindow.on("closed", () => (mainWindow = null));

	mainWindow.webContents.on("did-finish-load", () => {
		const version = app.getVersion();
		const windowTitle = `Payvo Wallet ${version}`;
		mainWindow && mainWindow.setTitle(windowTitle);

		broadcastURL(deeplinkingUrl);
	});

	mainWindow.webContents.on("new-window", (event) => {
		event.preventDefault();
	});

	if (isDev) {
		installExtensions()
			.then(() => mainWindow && mainWindow.webContents.openDevTools())
			.catch((error) => console.error(error));
	}
}

assignMenu();

app.on("ready", () => {
	createWindow();
	setupUpdater({ ipcMain, isDev, mainWindow });
	handleSingleInstance({ broadcastURL, mainWindow });
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});

app.on("open-url", (event, url) => {
	// Protocol handler for osx
	event.preventDefault();
	deeplinkingUrl = url;
	broadcastURL(deeplinkingUrl);
});

app.setAsDefaultProtocolClient("payvo", process.execPath, ["--"]);
app.allowRendererProcessReuse = false;

setupPlugins();
