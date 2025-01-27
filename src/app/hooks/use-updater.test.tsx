/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import { act, renderHook } from "@testing-library/react-hooks";
import { EnvironmentProvider } from "app/contexts";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import { toasts } from "app/services";
import electron from "electron";
import React from "react";
import { env, getDefaultProfileId, waitFor } from "utils/testing-library";

import { useUpdater } from "./use-updater";

let profile: Contracts.IProfile;

describe("useUpdater hook", () => {
	beforeAll(async () => {
		let isUpdateCalled = false;
		let updateDownloadedCalls = 0;

		profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);

		jest.spyOn(electron.ipcRenderer, "invoke").mockResolvedValue((event: string) => {
			if (event === "updater:check-for-updates") {
				const response = {
					cancellationToken: isUpdateCalled ? null : "1",
					updateInfo: { version: "3.0.0" },
				};
				isUpdateCalled = true;
				return response;
			}
			return true;
		});

		jest.spyOn(electron.ipcRenderer, "on").mockImplementation(
			(event_: any, callback: (event__: any, data?: any) => void) => {
				if (event_ === "updater:download-progress") {
					callback(event_, { percent: 30, total: 10, transferred: 3 });
				}

				if (event_ === "updater:update-downloaded" && updateDownloadedCalls === 0) {
					updateDownloadedCalls += 1;
					callback(event_);
				}
			},
		);
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	it("should handle cancel", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const { result } = renderHook(() => useUpdater(), { wrapper });

		act(() => {
			result.current.cancel();
		});

		await waitFor(() => expect(result.current.downloadStatus).toBe("canceled"));
	});

	it("should handle downloadUpdate", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const { result } = renderHook(() => useUpdater(), { wrapper });

		act(() => {
			result.current.downloadUpdate();
		});

		await waitFor(() => expect(result.current.downloadStatus).toBe("started"));
	});

	it("should handle quitInstall", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const { result } = renderHook(() => useUpdater(), { wrapper });

		act(() => {
			result.current.quitInstall();
		});

		await waitFor(() => expect(result.current.downloadStatus).toBe("idle"));

		act(() => {
			result.current.quitInstall(profile);
		});

		await waitFor(() => expect(result.current.downloadStatus).toBe("idle"));
	});

	it("should handle failed update check in notifyForUpdates", async () => {
		const toastSpy = jest.spyOn(toasts, "error");

		jest.spyOn(electron.ipcRenderer, "invoke").mockRejectedValueOnce(new Error("Error!"));

		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const { result } = renderHook(() => useUpdater(), { wrapper });

		act(() => {
			result.current.notifyForUpdates();
		});

		await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(commonTranslations.FAILED_UPDATE_CHECK));

		toastSpy.mockRestore();
	});

	it("should handle notifyForUpdates and find newer version", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const { result } = renderHook(() => useUpdater(), { wrapper });

		act(() => {
			result.current.notifyForUpdates();
		});

		await waitFor(() => expect(result.current.downloadStatus).toBe("idle"));
	});

	it("should handle notifyForUpdates and stay idle", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const { result } = renderHook(() => useUpdater(), { wrapper });

		act(() => {
			result.current.notifyForUpdates();
		});

		await waitFor(() => expect(result.current.downloadStatus).toBe("idle"));
	});

	it("should handle download progress", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;
		const { result } = renderHook(() => useUpdater(), { wrapper });

		act(() => {
			result.current.notifyForUpdates();
		});

		await waitFor(() =>
			expect(result.current.downloadProgress).toStrictEqual({ percent: 30, total: 10, transferred: 3 }),
		);
	});

	it("should set update version", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children} </EnvironmentProvider>;

		jest.spyOn(electron.ipcRenderer, "invoke").mockImplementation(() => {
			const response = {
				cancellationToken: "1",
				updateInfo: { version: "3.0.0" },
			};
			return Promise.resolve(response);
		});

		const { result, waitForNextUpdate } = renderHook(() => useUpdater(), { wrapper });

		act(() => {
			result.current.notifyForUpdates();
		});

		await waitForNextUpdate();

		await waitFor(() => expect(result.current.downloadStatus).toBe("idle"));
	});
});
