import electron from "electron";

import { appVersion, isIdle, openExternal, saveFile, setScreenshotProtection, setThemeSource } from "./electron-utils";

const defaultFilters = [
	{ extensions: ["json"], name: "JSON" },
	{ extensions: ["*"], name: "All Files" },
];

describe("Electron utils", () => {
	describe("setThemeSource", () => {
		it("should set theme source", () => {
			setThemeSource("theme");

			expect(electron.remote.nativeTheme.themeSource).toBe("theme");
		});
	});

	describe("setScreenshotProtection", () => {
		it("should not toggle in development mode", () => {
			const setContentProtectionMock: any = electron.remote.getCurrentWindow().setContentProtection;

			// Set Development mode
			Object.defineProperty(electron.remote.app, "isPackaged", {
				configurable: true,
				value: false,
			});

			setScreenshotProtection(true);

			expect(setContentProtectionMock).toHaveBeenNthCalledWith(1, false);

			setContentProtectionMock.mockClear();
			setScreenshotProtection(false);

			expect(setContentProtectionMock).toHaveBeenNthCalledWith(1, false);

			setContentProtectionMock.mockRestore();
		});

		it("should toggle in production mode", () => {
			const setContentProtectionMock = jest
				.spyOn(electron.remote.getCurrentWindow(), "setContentProtection")
				.mockImplementation();

			// Set Production mode
			Object.defineProperty(electron.remote.app, "isPackaged", {
				configurable: true,
				value: true,
			});

			setScreenshotProtection(true);

			expect(setContentProtectionMock).toHaveBeenNthCalledWith(1, true);

			setContentProtectionMock.mockClear();
			setScreenshotProtection(false);

			expect(setContentProtectionMock).toHaveBeenNthCalledWith(1, false);

			setContentProtectionMock.mockRestore();
		});

		it("should not toggle if process.env is set while in production", () => {
			const setContentProtectionMock = jest
				.spyOn(electron.remote.getCurrentWindow(), "setContentProtection")
				.mockImplementation();

			process.env.ELECTRON_IS_DEV = "1";

			expect("ELECTRON_IS_DEV" in process.env).toBe(true);
			expect(process.env.ELECTRON_IS_DEV).toBe("1");
			expect(Number.parseInt(process.env.ELECTRON_IS_DEV!, 10)).toBe(1);

			setScreenshotProtection(true);

			expect(setContentProtectionMock).toHaveBeenNthCalledWith(1, false);

			setContentProtectionMock.mockClear();
			setScreenshotProtection(false);

			expect(setContentProtectionMock).toHaveBeenNthCalledWith(1, false);

			setContentProtectionMock.mockRestore();

			process.env.ELECTRON_IS_DEV = undefined;
		});
	});

	describe("appVersion", () => {
		it("should return the current app version", () => {
			process.env.ELECTRON_IS_DEV = "1";

			expect(appVersion()).toBe("1.0.0");

			process.env.ELECTRON_IS_DEV = undefined;
		});

		it("should return the current app version in development mode", () => {
			expect(appVersion()).toBe("1.0.0");
		});
	});

	describe("saveFile", () => {
		let showSaveDialogMock: jest.SpyInstance;

		beforeEach(() => {
			showSaveDialogMock = jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
				filePath: "filePath",
			}));
		});

		afterEach(() => {
			showSaveDialogMock.mockRestore();
		});

		it("should return early when the obtained filePath is falsy", async () => {
			showSaveDialogMock = jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
				filePath: undefined,
			}));

			await expect(saveFile()).resolves.toBeUndefined();
		});

		it("should return the basename", async () => {
			showSaveDialogMock = jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
				filePath: "filename.txt",
			}));

			await expect(saveFile("raw", "filename", { returnBasename: true })).resolves.toBe("filename.txt");
		});

		describe("with filter parameter", () => {
			it("should parse a single FileFilter correctly", async () => {
				await saveFile("raw", "path", { filters: defaultFilters[0] });

				expect(showSaveDialogMock).toHaveBeenCalledWith({
					defaultPath: "path",
					filters: [defaultFilters[0]],
				});
			});

			it("should parse an array of FileFilters correctly", async () => {
				await saveFile("raw", "path", { filters: [defaultFilters[1]] });

				expect(showSaveDialogMock).toHaveBeenCalledWith({
					defaultPath: "path",
					filters: [defaultFilters[1]],
				});
			});

			it.each([null, undefined])("should fallback to the default filters when filters is %s", async (filters) => {
				await saveFile("raw", "path", { filters });

				expect(showSaveDialogMock).toHaveBeenCalledWith({
					defaultPath: "path",
					filters: defaultFilters,
				});
			});
		});

		describe("when restricting the file path", () => {
			it("should not throw an error if the given filepath is valid", async () => {
				showSaveDialogMock = jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
					filePath: "./filePath",
				}));

				await expect(saveFile(null, null, { restrictToPath: "./" })).resolves.not.toThrow();
			});

			it("should throw an error if the given filepath is invalid", async () => {
				showSaveDialogMock = jest.spyOn(electron.remote.dialog, "showSaveDialog").mockImplementation(() => ({
					filePath: "/home/bar/foo",
				}));

				await expect(saveFile(null, null, { restrictToPath: "/home/foo" })).rejects.toThrow(
					`Writing to "/home/bar/foo" is not allowed`,
				);
			});
		});
	});

	describe("openExternal", () => {
		let ipcRendererMock: jest.SpyInstance;

		beforeEach(() => {
			ipcRendererMock = jest.spyOn(electron.ipcRenderer, "send").mockImplementation();
		});

		afterEach(() => {
			ipcRendererMock.mockRestore();
		});

		it.each(["http://foo.bar/", "https://foo.bar/"])("should open links with a valid protocol (%s)", (link) => {
			openExternal(link);

			expect(ipcRendererMock).toHaveBeenCalledWith("open-external", link);
		});

		it.each(["ftp://foo.bar/", "smb://foo.bar/", "file://foo/bar", "\\\\\\\\foo\\bar"])(
			"should not open links with an invalid protocol (%s)",
			(link) => {
				expect(() => openExternal(link)).toThrow("");
				expect(ipcRendererMock).not.toHaveBeenCalled();
			},
		);
	});

	describe("isIdle", () => {
		let getSystemIdleTimeMock: jest.SpyInstance;

		beforeEach(() => {
			getSystemIdleTimeMock = jest
				.spyOn(electron.remote.powerMonitor, "getSystemIdleTime")
				.mockImplementation(() => 60);
		});

		afterEach(() => {
			getSystemIdleTimeMock.mockRestore();
		});

		it("should return false if threshold is greater than idle time", () => {
			expect(isIdle(62)).toBe(false);
		});

		it("should return true if threshold is smaller than idle time", () => {
			expect(isIdle(10)).toBe(true);
		});
	});
});
