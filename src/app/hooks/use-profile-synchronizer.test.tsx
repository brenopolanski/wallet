/* eslint-disable @typescript-eslint/require-await */
import { act, renderHook } from "@testing-library/react-hooks";
import { ConfigurationProvider, EnvironmentProvider, useConfiguration } from "app/contexts";
import { toasts } from "app/services";
import electron from "electron";
import { createMemoryHistory } from "history";
import { PluginManagerProvider } from "plugins/context/PluginManagerProvider";
import React from "react";
import { Route } from "react-router-dom";
import {
	act as renderAct,
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	pluginManager,
	render,
	screen,
	syncDelegates,
	waitFor,
} from "utils/testing-library";

import {
	useProfileJobs,
	useProfileRestore,
	useProfileStatusWatcher,
	useProfileSynchronizer,
	useProfileSyncStatus,
} from "./use-profile-synchronizer";
import * as profileUtilsHook from "./use-profile-utils";

const history = createMemoryHistory();
const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;

describe("useProfileSyncStatus", () => {
	it("should restore", async () => {
		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;
		const profile = env.profiles().findById(getDefaultProfileId());
		const profileStatusMock = jest.spyOn(profile.status(), "isRestored").mockReturnValue(false);

		const wrapper = ({ children }: any) => <ConfigurationProvider>{children}</ConfigurationProvider>;

		const {
			result: { current },
		} = renderHook(() => useProfileSyncStatus(), { wrapper });

		expect(current.shouldRestore(profile)).toBe(true);

		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";

		profileStatusMock.mockRestore();
	});

	it("#idle", async () => {
		process.env.REACT_APP_IS_E2E = undefined;
		const profile = env.profiles().findById(getDefaultProfileId());

		const wrapper = ({ children }: any) => <ConfigurationProvider>{children}</ConfigurationProvider>;

		const {
			result: { current },
		} = renderHook(() => useProfileSyncStatus(), { wrapper });

		expect(current.isIdle()).toBe(true);
		expect(current.shouldRestore(profile)).toBe(false);
		expect(current.shouldSync()).toBe(true);
		expect(current.shouldMarkCompleted()).toBe(false);
	});

	it("#restoring", async () => {
		process.env.REACT_APP_IS_E2E = undefined;
		const profile = env.profiles().findById(getDefaultProfileId());

		const wrapper = ({ children }: any) => <ConfigurationProvider>{children}</ConfigurationProvider>;

		const {
			result: { current },
		} = renderHook(() => useProfileSyncStatus(), { wrapper });

		act(() => {
			current.setStatus("restoring");
		});

		expect(current.isIdle()).toBe(false);
		expect(current.shouldRestore(profile)).toBe(false);
		expect(current.shouldSync()).toBe(false);
		expect(current.shouldMarkCompleted()).toBe(false);
	});

	it("#restored", async () => {
		process.env.REACT_APP_IS_E2E = undefined;
		const profile = env.profiles().findById(getDefaultProfileId());

		const wrapper = ({ children }: any) => <ConfigurationProvider>{children}</ConfigurationProvider>;

		const {
			result: { current },
		} = renderHook(() => useProfileSyncStatus(), { wrapper });

		act(() => {
			current.markAsRestored(profile.id());
		});

		expect(current.isIdle()).toBe(false);
		expect(current.shouldRestore(profile)).toBe(false);
		expect(current.shouldSync()).toBe(true);
		expect(current.shouldMarkCompleted()).toBe(false);
	});

	it("#syncing", async () => {
		process.env.REACT_APP_IS_E2E = undefined;
		const profile = env.profiles().findById(getDefaultProfileId());

		const wrapper = ({ children }: any) => <ConfigurationProvider>{children}</ConfigurationProvider>;

		const {
			result: { current },
		} = renderHook(() => useProfileSyncStatus(), { wrapper });

		act(() => {
			current.setStatus("idle");
			current.setStatus("syncing");
		});

		expect(current.isIdle()).toBe(false);
		expect(current.shouldRestore(profile)).toBe(false);
		expect(current.shouldSync()).toBe(false);
		expect(current.shouldMarkCompleted()).toBe(false);
	});

	it("#synced", async () => {
		process.env.REACT_APP_IS_E2E = undefined;
		const profile = env.profiles().findById(getDefaultProfileId());

		const wrapper = ({ children }: any) => <ConfigurationProvider>{children}</ConfigurationProvider>;

		const {
			result: { current },
		} = renderHook(() => useProfileSyncStatus(), { wrapper });

		act(() => {
			current.setStatus("synced");
		});

		expect(current.isIdle()).toBe(false);
		expect(current.shouldRestore(profile)).toBe(false);
		expect(current.shouldSync()).toBe(false);
		expect(current.shouldMarkCompleted()).toBe(true);
	});

	it("#completed", async () => {
		process.env.REACT_APP_IS_E2E = undefined;
		const profile = env.profiles().findById(getDefaultProfileId());

		const wrapper = ({ children }: any) => <ConfigurationProvider>{children}</ConfigurationProvider>;

		const {
			result: { current },
		} = renderHook(() => useProfileSyncStatus(), { wrapper });

		act(() => {
			current.setStatus("completed");
		});

		expect(current.isIdle()).toBe(false);
		expect(current.shouldRestore(profile)).toBe(false);
		expect(current.shouldSync()).toBe(false);
		expect(current.shouldMarkCompleted()).toBe(false);
	});
});

describe("useProfileSynchronizer", () => {
	beforeEach(async () => {
		const profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();

		await syncDelegates(profile);

		jest.spyOn(toasts, "success").mockImplementation();
		jest.spyOn(toasts, "dismiss").mockResolvedValue(undefined);
	});

	afterEach(() => {
		jest.clearAllTimers();
		jest.useRealTimers();
	});

	it("should clear last profile sync jobs", async () => {
		history.push(dashboardURL);

		jest.useFakeTimers();

		const { getByTestId, findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<div data-testid="ProfileSynced">test</div>
			</Route>,
			{
				history,
				routes: [dashboardURL],
				withProfileSynchronizer: true,
			},
		);

		renderAct(() => {
			jest.runOnlyPendingTimers();
		});

		await findByTestId("ProfileSynced");

		renderAct(() => {
			history.push("/");

			jest.runAllTimers();
		});

		await waitFor(() => expect(history.location.pathname).toBe("/"));
		await waitFor(() => expect(() => getByTestId("ProfileSynced")).toThrow(/Unable to find an element by/), {
			timeout: 4000,
		});

		jest.clearAllTimers();
	});

	it("should not sync if not in profile's url", async () => {
		history.push("/");

		jest.useFakeTimers();
		const { findByTestId } = render(
			<Route path="/">
				<div data-testid="RenderedContent">test</div>
			</Route>,
			{
				history,
				routes: ["/"],
				withProfileSynchronizer: true,
			},
		);

		await findByTestId("RenderedContent");
		jest.runAllTimers();
	});

	it("should sync only valid profiles from url", async () => {
		history.push("/profiles/invalidId/dashboard");

		const { findByTestId } = render(
			<Route path="/">
				<div data-testid="RenderedContent">test</div>
			</Route>,
			{
				history,
				routes: ["/profiles/:profileId/dashboard"],
				withProfileSynchronizer: true,
			},
		);

		await findByTestId("RenderedContent");
	});

	it("should restore profile", async () => {
		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;
		process.env.REACT_APP_IS_E2E = undefined;

		history.push(dashboardURL);

		const { findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<div data-testid="ProfileRestored">test</div>
			</Route>,
			{
				history,
				routes: [dashboardURL],
				withProfileSynchronizer: true,
			},
		);

		await findByTestId("ProfileRestored");
		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";
	});

	it("should handle restoration error for password protected profile", async () => {
		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;

		const passwordProtectedUrl = "/profiles/cba050f1-880f-45f0-9af9-cfe48f406052/dashboard";
		history.push(passwordProtectedUrl);

		const profile = env.profiles().findById("cba050f1-880f-45f0-9af9-cfe48f406052");
		profile.wallets().flush();

		const memoryPasswordMock = jest.spyOn(profile.password(), "get").mockImplementation(() => {
			throw new Error("password not found");
		});

		const { getByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<div data-testid="Content">test</div>
			</Route>,
			{
				history,
				routes: [passwordProtectedUrl],
				withProfileSynchronizer: true,
			},
		);

		await waitFor(() => expect(() => getByTestId("Content")).toThrow(/Unable to find an element by/));
		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";
		memoryPasswordMock.mockRestore();
	});

	it("should restore profile and reset test password for e2e", async () => {
		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;
		process.env.REACT_APP_IS_E2E = "1";

		history.push(dashboardURL);

		const { findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<div data-testid="ProfileRestored">test</div>
			</Route>,
			{
				history,
				routes: [dashboardURL],
				withProfileSynchronizer: true,
			},
		);

		await findByTestId("ProfileRestored");
		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";
	});

	it("should sync profile and handle resync with errored networks", async () => {
		history.push(dashboardURL);
		let configuration: any;
		let profileErroredNetworks: string[] = [];

		const Component = () => {
			configuration = useConfiguration();

			useProfileSynchronizer({
				onProfileSyncError: (erroredNetworks: string[], retrySync) => {
					profileErroredNetworks = erroredNetworks;
					retrySync();
				},
			});

			return <div data-testid="ProfileSynced">test</div>;
		};

		const { findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Component />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await findByTestId("ProfileSynced");

		const profile = env.profiles().findById(getDefaultProfileId());
		const mockWalletSyncStatus = jest
			.spyOn(profile.wallets().first(), "hasBeenFullyRestored")
			.mockReturnValue(false);

		await renderAct(async () => {
			configuration.setConfiguration({ profileIsSyncingWallets: true });
		});
		await waitFor(() => expect(configuration.profileIsSyncingWallets).toBe(true), { timeout: 10_000 });

		await renderAct(async () => {
			configuration.setConfiguration({ profileIsSyncingWallets: false });
		});

		await waitFor(() => expect(configuration.profileIsSyncingWallets).toBe(false));
		await waitFor(() => expect(profileErroredNetworks).toHaveLength(1));

		mockWalletSyncStatus.mockRestore();
	});

	it("should not start syncing for empty profile", async () => {
		let configuration: any;
		const onProfileSyncStart = jest.fn();

		const emptyProfile = env.profiles().create("empty profile");

		const dashboardURL = `/profiles/${emptyProfile.id()}/dashboard`;
		history.push(dashboardURL);

		const Component = () => {
			configuration = useConfiguration();

			useProfileSynchronizer({
				onProfileSyncStart,
			});

			return <div data-testid="Dashboard">test</div>;
		};

		const { findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<Component />
			</Route>,
			{
				history,
				routes: [dashboardURL],
			},
		);

		await findByTestId("Dashboard");

		await waitFor(() => expect(configuration.profileHasSyncedOnce).toBe(true));

		expect(onProfileSyncStart).not.toHaveBeenCalled();
	});

	it("should reset sync profile wallets", async () => {
		history.push(dashboardURL);

		const profile = env.profiles().findById(getDefaultProfileId());
		let configuration: any;

		const Component = () => {
			configuration = useConfiguration();
			const { syncProfileWallets } = useProfileJobs(profile);

			return <button data-testid="ResetSyncProfile" onClick={() => syncProfileWallets(true)} />;
		};

		render(
			<Route path="/profiles/:profileId/dashboard">
				<Component />
			</Route>,
			{
				history,
				routes: [dashboardURL],
				withProfileSynchronizer: true,
			},
		);

		await screen.findByTestId("ResetSyncProfile");

		await waitFor(() => expect(configuration.isProfileInitialSync).toBe(false));

		fireEvent.click(screen.getByTestId("ResetSyncProfile"));

		await waitFor(() => expect(configuration.isProfileInitialSync).toBe(true));
	});

	it("should sync profile", async () => {
		history.push(dashboardURL);

		const { findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<div data-testid="ProfileSynced">test</div>
			</Route>,
			{
				history,
				routes: [dashboardURL],
				withProfileSynchronizer: true,
			},
		);

		await findByTestId("ProfileSynced");
	});
});

describe("useProfileRestore", () => {
	it("should not restore profile if already restored in tests", async () => {
		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";
		const profile = env.profiles().findById(getDefaultProfileId());

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const {
			result: { current },
		} = renderHook(() => useProfileRestore(), { wrapper });

		await expect(current.restoreProfile(profile)).resolves.toBe(false);

		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;
	});

	it("should restore and save profile", async () => {
		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;
		process.env.REACT_APP_IS_E2E = undefined;
		const profile = env.profiles().findById(getDefaultProfileId());
		const profileStatusMock = jest.spyOn(profile.status(), "isRestored").mockReturnValue(false);
		profile.wallets().flush();

		const mockProfileFromUrl = jest.spyOn(profileUtilsHook, "useProfileUtils").mockImplementation(() => ({
			getProfileFromUrl: () => profile,
			getProfileStoredPassword: () => undefined,
		}));

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const {
			result: { current },
		} = renderHook(() => useProfileRestore(), { wrapper });

		let isRestored;

		await act(async () => {
			isRestored = await current.restoreProfile(profile);
		});

		expect(isRestored).toBe(true);

		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";
		mockProfileFromUrl.mockRestore();
		profileStatusMock.mockRestore();
	});

	it("should restore a profile that uses password", async () => {
		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;
		process.env.REACT_APP_IS_E2E = undefined;
		const profile = env.profiles().findById("cba050f1-880f-45f0-9af9-cfe48f406052");
		const profileStatusMock = jest.spyOn(profile.status(), "isRestored").mockReturnValue(false);

		const mockProfileFromUrl = jest.spyOn(profileUtilsHook, "useProfileUtils").mockImplementation(() => ({
			getProfileFromUrl: () => profile,
			getProfileStoredPassword: () => "password",
		}));

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const {
			result: { current },
		} = renderHook(() => useProfileRestore(), { wrapper });

		let isRestored;

		await act(async () => {
			isRestored = await current.restoreProfile(profile, "password");
		});

		expect(isRestored).toBe(true);

		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";
		mockProfileFromUrl.mockRestore();
		profileStatusMock.mockRestore();
	});

	it("should not restore if url doesn't match active profile", async () => {
		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;
		process.env.REACT_APP_IS_E2E = undefined;
		const profile = env.profiles().findById(getDefaultProfileId());
		profile.status().reset();
		profile.wallets().flush();

		const mockProfileFromUrl = jest.spyOn(profileUtilsHook, "useProfileUtils").mockImplementation(() => ({
			getProfileFromUrl: () => undefined,
			getProfileStoredPassword: () => undefined,
		}));

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const {
			result: { current },
		} = renderHook(() => useProfileRestore(), { wrapper });

		let isRestored;

		await act(async () => {
			isRestored = await current.restoreProfile(profile);
		});

		expect(isRestored).toBeFalsy();

		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";
		mockProfileFromUrl.mockRestore();
	});

	it("should restore only once", async () => {
		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;
		process.env.REACT_APP_IS_E2E = undefined;

		const profile = env.profiles().findById(getDefaultProfileId());
		profile.wallets().flush();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider defaultConfiguration={{ restoredProfiles: [profile.id()] }}>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const {
			result: { current },
		} = renderHook(() => useProfileRestore(), { wrapper });

		let isRestored;

		await act(async () => {
			isRestored = await current.restoreProfile(profile);
		});

		expect(isRestored).toBe(false);

		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";
	});

	it("should restore sign out automatically", async () => {
		jest.useFakeTimers();
		process.env.TEST_PROFILES_RESTORE_STATUS = undefined;
		process.env.REACT_APP_IS_E2E = undefined;

		const profile = env.profiles().findById(getDefaultProfileId());
		profile.status().reset();

		history.push(dashboardURL);

		const idleTimeMock = jest
			.spyOn(electron.remote.powerMonitor, "getSystemIdleTime")
			.mockImplementation(() => 1000);

		const { findByTestId } = render(
			<Route path="/profiles/:profileId/dashboard">
				<div data-testid="ProfileRestored">test</div>
			</Route>,
			{
				history,
				routes: [dashboardURL],
				withProfileSynchronizer: true,
			},
		);

		const historyMock = jest.spyOn(history, "push").mockReturnValue();

		await findByTestId("ProfileRestored", undefined, { timeout: 4000 });

		await waitFor(() => expect(historyMock).toHaveBeenCalledWith("/"), { timeout: 4000 });

		process.env.TEST_PROFILES_RESTORE_STATUS = "restored";
		idleTimeMock.mockRestore();
		historyMock.mockRestore();
	});

	it("should sync profile and handle sync error", async () => {
		history.push(dashboardURL);

		const profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();

		profile.wallets().push(
			await profile.walletFactory().fromMnemonicWithBIP39({
				coin: "ARK",
				mnemonic: MNEMONICS[0],
				network: "ark.devnet",
			}),
		);

		profile.wallets().push(
			await profile.walletFactory().fromAddress({
				address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
				coin: "ARK",
				network: "ark.mainnet",
			}),
		);

		const profileSyncMock = jest.spyOn(profile, "sync").mockImplementation(() => {
			throw new Error("sync test");
		});

		render(
			<Route path="/profiles/:profileId/dashboard">
				<div data-testid="ProfileSynced">test</div>
			</Route>,
			{
				history,
				routes: [dashboardURL],
				withProfileSynchronizer: true,
			},
		);

		await waitFor(() => expect(profileSyncMock).toHaveBeenCalledWith());

		profileSyncMock.mockRestore();
	});
});

describe("useProfileStatusWatcher", () => {
	it("should not monitor for network status if profile is undefined", async () => {
		const onProfileSyncComplete = jest.fn();
		const onProfileSyncError = jest.fn();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		renderHook(
			() => useProfileStatusWatcher({ env, onProfileSyncComplete, onProfileSyncError, profile: undefined }),
			{
				wrapper,
			},
		);

		expect(onProfileSyncComplete).not.toHaveBeenCalled();
		expect(onProfileSyncError).not.toHaveBeenCalled();
	});

	it("should not monitor for network status if profile has not finished syncing", async () => {
		const onProfileSyncComplete = jest.fn();
		const onProfileSyncError = jest.fn();
		const profile = env.profiles().findById(getDefaultProfileId());

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider
					defaultConfiguration={{ profileHasSynced: false, profileIsSyncingWallets: false }}
				>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		renderHook(() => useProfileStatusWatcher({ env, onProfileSyncComplete, onProfileSyncError, profile }), {
			wrapper,
		});

		expect(onProfileSyncComplete).not.toHaveBeenCalled();
		expect(onProfileSyncError).not.toHaveBeenCalled();
	});

	it("should not monitor for network status if profile is still syncing wallets", async () => {
		const onProfileSyncComplete = jest.fn();
		const onProfileSyncError = jest.fn();
		const profile = env.profiles().findById(getDefaultProfileId());

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider defaultConfiguration={{ profileHasSynced: true, profileIsSyncingWallets: true }}>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		renderHook(() => useProfileStatusWatcher({ env, onProfileSyncComplete, onProfileSyncError, profile }), {
			wrapper,
		});

		expect(onProfileSyncComplete).not.toHaveBeenCalled();
		expect(onProfileSyncError).not.toHaveBeenCalled();
	});

	it("should not monitor for network status if profile has no wallets", async () => {
		const onProfileSyncComplete = jest.fn();
		const onProfileSyncError = jest.fn();
		const profile = env.profiles().findById(getDefaultProfileId());
		const walletCountMock = jest.spyOn(profile.wallets(), "count").mockReturnValue(0);

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		renderHook(() => useProfileStatusWatcher({ env, onProfileSyncComplete, onProfileSyncError, profile }), {
			wrapper,
		});

		expect(onProfileSyncComplete).not.toHaveBeenCalled();
		expect(onProfileSyncError).not.toHaveBeenCalled();

		walletCountMock.mockRestore();
	});

	it("should trigger sync error callback if profile has errored wallet networks", async () => {
		const onProfileSyncComplete = jest.fn();
		const onProfileSyncError = jest.fn();
		const profile = env.profiles().findById(getDefaultProfileId());
		const mockWalletSyncStatus = jest
			.spyOn(profile.wallets().first(), "hasBeenFullyRestored")
			.mockReturnValue(false);

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider
					defaultConfiguration={{
						profileHasSynced: true,
						profileHasSyncedOnce: true,
						profileIsSyncingWallets: false,
					}}
				>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		renderHook(() => useProfileStatusWatcher({ env, onProfileSyncComplete, onProfileSyncError, profile }), {
			wrapper,
		});

		expect(onProfileSyncComplete).not.toHaveBeenCalled();
		expect(onProfileSyncError).toHaveBeenCalledWith(
			expect.arrayContaining([expect.any(String)]),
			expect.any(Function),
		);

		mockWalletSyncStatus.mockRestore();
	});

	it("should stay idle if network status has not changed", async () => {
		const onProfileSyncComplete = jest.fn();
		const onProfileSyncError = jest.fn();
		const profile = env.profiles().findById(getDefaultProfileId());
		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider
					defaultConfiguration={{
						profileHasSynced: true,
						profileHasSyncedOnce: true,
						profileIsSyncingWallets: false,
					}}
				>
					<PluginManagerProvider manager={pluginManager} services={[]}>
						{children}
					</PluginManagerProvider>
				</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const setState = jest.fn();
		const useStateSpy = jest.spyOn(React, "useState");
		//@ts-ignore
		useStateSpy.mockImplementation((initialState, setActualState) => {
			// Use actual state if it's not `isInitialSync` in useProfileStatusWatcher
			if (initialState !== true) {
				return [initialState, setActualState];
			}

			if (initialState.previousErroredNetworks) {
				return [{ ...initialState, previousErroredNetworks: ["ARK Devnet"] }, setActualState];
			}

			// Mock `isInitialSync` as false for idle state
			return [false, setState];
		});

		renderHook(
			() =>
				useProfileStatusWatcher({
					env,
					onProfileSyncComplete,
					onProfileSyncError,
					profile,
				}),
			{
				wrapper,
			},
		);

		useStateSpy.mockRestore();

		expect(onProfileSyncComplete).not.toHaveBeenCalled();
		expect(onProfileSyncError).not.toHaveBeenCalled();
	});
});
