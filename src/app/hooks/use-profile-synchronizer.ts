import { isEqual, uniq } from "@payvo/sdk-helpers";
import { Contracts, Environment } from "@payvo/sdk-profiles";
import { useConfiguration, useEnvironmentContext } from "app/contexts";
import { useAccentColor } from "app/hooks/use-accent-color";
import { DashboardConfiguration } from "domains/dashboard/pages/Dashboard";
import { usePluginManagerContext } from "plugins/context/PluginManagerProvider";
import { useEffect, useMemo, useRef } from "react";
import { matchPath, useHistory, useLocation } from "react-router-dom";
import { isIdle } from "utils/electron-utils";

import { usePrevious } from "./use-previous";
import { useProfileUtils } from "./use-profile-utils";
import { useScreenshotProtection } from "./use-screenshot-protection";
import { useSynchronizer } from "./use-synchronizer";
import { useTheme } from "./use-theme";
import { useUpdater } from "./use-updater";

enum Intervals {
	VeryShort = 15_000,
	Short = 30_000,
	Medium = 60_000,
	Long = 120_000,
	VeryLong = 7_200_000,
}

const useProfileWatcher = () => {
	const location = useLocation();

	const { env } = useEnvironmentContext();
	const { getProfileById } = useProfileUtils(env);

	const pathname = (location as any).location?.pathname || location.pathname;
	const match = useMemo(() => matchPath(pathname, { path: "/profiles/:profileId" }), [pathname]);
	const profileId = (match?.params as any)?.profileId;
	const allProfilesCount = env.profiles().count();

	return useMemo(() => getProfileById(profileId), [profileId, env, allProfilesCount, getProfileById]); // eslint-disable-line react-hooks/exhaustive-deps
};

export const useProfileJobs = (profile?: Contracts.IProfile): Record<string, any> => {
	const { env } = useEnvironmentContext();
	const { setConfiguration } = useConfiguration();
	const { notifyForUpdates } = useUpdater();

	const history = useHistory();

	const walletsCount = profile?.wallets().count();

	return useMemo(() => {
		if (!profile) {
			return [];
		}

		const syncProfileWallets = {
			callback: async (reset = false) => {
				try {
					setConfiguration({
						profileIsSyncingWallets: true,
						...(reset && { isProfileInitialSync: true }),
					});

					await env.wallets().syncByProfile(profile);
					await profile.sync();

					// Update dashboard transactions
					await profile.notifications().transactions().sync();
				} finally {
					setConfiguration({ profileIsSyncingWallets: false });
				}
			},
			interval: Intervals.VeryShort,
		};

		const syncWalletUpdates = {
			callback: () => notifyForUpdates(profile),
			interval: Intervals.VeryLong,
		};

		// Syncing delegates is necessary for every domain not only votes,
		// Because it's used in wallet and transaction lists
		const syncDelegates = {
			callback: () => env.delegates().syncAll(profile),
			interval: Intervals.Long,
		};

		const syncExchangeRates = {
			callback: async () => {
				setConfiguration({ profileIsSyncingExchangeRates: true });

				const currencies = Object.keys(profile.coins().all());
				const allRates = await Promise.all(
					currencies.map((currency) => env.exchangeRates().syncAll(profile, currency)),
				);

				setConfiguration({ profileIsSyncingExchangeRates: false });

				return allRates;
			},
			interval: Intervals.Long,
		};

		const syncNotifications = {
			callback: () => profile.notifications().transactions().sync(),
			interval: Intervals.Long,
		};

		const syncKnownWallets = {
			callback: () => env.knownWallets().syncAll(profile),
			interval: Intervals.Long,
		};

		const checkActivityState = {
			callback: () => {
				const idleThreshold =
					(profile.settings().get(Contracts.ProfileSetting.AutomaticSignOutPeriod, 15) as number) * 60;

				if (isIdle(idleThreshold)) {
					history.push("/");
				}
			},
			interval: Intervals.VeryShort,
		};

		return {
			allJobs: [
				syncExchangeRates,
				syncNotifications,
				syncKnownWallets,
				syncDelegates,
				checkActivityState,
				syncWalletUpdates,
				syncProfileWallets,
			],
			syncExchangeRates: syncExchangeRates.callback,
			syncProfileWallets: syncProfileWallets.callback,
		};
	}, [env, profile, walletsCount, setConfiguration]); // eslint-disable-line react-hooks/exhaustive-deps
};

interface ProfileSyncState {
	status: string | null;
	restored: string[];
}

export const useProfileSyncStatus = () => {
	const { profileIsRestoring, setConfiguration } = useConfiguration();
	const { current } = useRef<ProfileSyncState>({
		restored: [],
		status: "idle",
	});

	const isIdle = () => current.status === "idle";
	const isRestoring = () => profileIsRestoring || current.status === "restoring";
	const isSyncing = () => current.status === "syncing";
	const isSynced = () => current.status === "synced";
	const isCompleted = () => current.status === "completed";

	const shouldRestore = (profile: Contracts.IProfile) => {
		// For unit tests only. This flag prevents from running restore multiple times
		// as the profiles are all restored before all (see jest.setup)
		const isRestoredInTests = process.env.TEST_PROFILES_RESTORE_STATUS === "restored";
		if (isRestoredInTests) {
			return false;
		}

		return !isSyncing() && !isRestoring() && !isSynced() && !isCompleted() && !profile.status().isRestored();
	};

	const shouldSync = () => !isSyncing() && !isRestoring() && !isSynced() && !isCompleted();

	const shouldMarkCompleted = () => isSynced() && !isCompleted();

	const markAsRestored = (profileId: string) => {
		current.status = "restored";
		current.restored.push(profileId);
		setConfiguration({ profileIsRestoring: false });
	};

	const resetStatuses = (profiles: Contracts.IProfile[]) => {
		current.status = "idle";
		current.restored = [];
		setConfiguration({ profileIsRestoring: false, profileIsSyncing: true });
		for (const profile of profiles) {
			profile.status().reset();
		}
	};

	const setStatus = (status: string) => {
		current.status = status;
		if (status === "restoring") {
			setConfiguration({ profileIsRestoring: true, profileIsSyncingExchangeRates: true });
		}

		if (status === "syncing") {
			setConfiguration({ profileIsSyncingExchangeRates: true });
		}

		if (status === "idle") {
			setConfiguration({ profileIsSyncingExchangeRates: true });
		}
	};

	return {
		isCompleted,
		isIdle,
		markAsRestored,
		resetStatuses,
		setStatus,
		shouldMarkCompleted,
		shouldRestore,
		shouldSync,
		status: () => current.status,
	};
};

export const useProfileRestore = () => {
	const { shouldRestore, markAsRestored, setStatus } = useProfileSyncStatus();
	const { persist, env } = useEnvironmentContext();
	const { pluginManager, resetPlugins, restoreEnabledPlugins } = usePluginManagerContext();
	const { getProfileFromUrl, getProfileStoredPassword } = useProfileUtils(env);
	const { setConfiguration } = useConfiguration();
	const history = useHistory();

	const restoreProfileConfig = (profile: Contracts.IProfile) => {
		const defaultConfiguration: DashboardConfiguration = {
			selectedNetworkIds: uniq(
				profile
					.wallets()
					.values()
					.map((wallet) => wallet.network().id()),
			),
			viewType: "grid",
			walletsDisplayType: "all",
		};

		const config = profile
			.settings()
			.get(Contracts.ProfileSetting.DashboardConfiguration, defaultConfiguration) as DashboardConfiguration;

		setConfiguration({ dashboard: config });
	};

	const restorePlugins = (profile: Contracts.IProfile) => {
		const current = pluginManager.plugins().currentProfile();

		if (current === undefined) {
			restoreEnabledPlugins(profile);
			return;
		}

		if (current?.id() !== profile.id()) {
			resetPlugins();
		}
	};

	const restoreProfile = async (profile: Contracts.IProfile, passwordInput?: string) => {
		if (!shouldRestore(profile)) {
			return false;
		}

		const password = passwordInput || getProfileStoredPassword(profile);

		setStatus("restoring");

		// Reset profile normally (passwordless or not)
		await env.profiles().restore(profile, password);
		markAsRestored(profile.id());

		// Restore profile's config
		restoreProfileConfig(profile);

		// Restore enabled plugins
		restorePlugins(profile);

		// Profile restore finished but url changed in the meanwhile.
		// Prevent from unnecessary save of old profile.
		const activeProfile = getProfileFromUrl(history?.location?.pathname);
		if (activeProfile?.id() !== profile.id()) {
			return;
		}

		await persist();
		return true;
	};

	return {
		restorePlugins,
		restoreProfile,
		restoreProfileConfig,
	};
};

interface ProfileStatusWatcherProperties {
	onProfileSyncError?: (failedNetworkNames: string[], retrySync: () => void) => void;
	onProfileSyncStart?: () => void;
	onProfileSyncComplete?: () => void;
	onProfileSignOut?: () => void;
	profile?: Contracts.IProfile;
	env: Environment;
}

export const useProfileStatusWatcher = ({
	env,
	profile,
	onProfileSyncError,
	onProfileSyncComplete,
}: ProfileStatusWatcherProperties) => {
	const {
		setConfiguration,
		profileIsSyncing,
		profileIsSyncingWallets,
		profileHasSyncedOnce,
		profileErroredNetworks,
		isProfileInitialSync,
	} = useConfiguration();

	const { getErroredNetworks } = useProfileUtils(env);
	const previousErroredNetworks = usePrevious(profileErroredNetworks) || [];

	const walletsCount = profile?.wallets().count();

	useEffect(() => {
		if (!profile || walletsCount === 0) {
			return;
		}

		if (!profileHasSyncedOnce || profileIsSyncingWallets) {
			return;
		}

		const { erroredNetworks } = getErroredNetworks(profile);
		const isStatusChanged = !isEqual(erroredNetworks, previousErroredNetworks);

		// Prevent from showing network status toasts on every sync.
		// Show them only on the initial sync and then when failed networks change.
		if (!isProfileInitialSync && !isStatusChanged) {
			return;
		}

		setConfiguration({ profileErroredNetworks: erroredNetworks });

		if (erroredNetworks.length > 0) {
			onProfileSyncError?.(erroredNetworks, () => {
				setConfiguration({ isProfileInitialSync: true });
			});
		}

		if (erroredNetworks.length === 0) {
			onProfileSyncComplete?.();
		}

		setConfiguration({ isProfileInitialSync: false });
	}, [profileIsSyncingWallets, profileIsSyncing, profileHasSyncedOnce, getErroredNetworks, profile, walletsCount]); // eslint-disable-line react-hooks/exhaustive-deps
};

interface ProfileSynchronizerProperties {
	onProfileSyncError?: (failedNetworkNames: string[], retrySync: () => void) => void;
	onProfileRestoreError?: (error: TypeError) => void;
	onProfileSyncStart?: () => void;
	onProfileSyncComplete?: () => void;
	onProfileSignOut?: () => void;
}

export const useProfileSynchronizer = ({
	onProfileRestoreError,
	onProfileSyncError,
	onProfileSyncStart,
	onProfileSyncComplete,
	onProfileSignOut,
}: ProfileSynchronizerProperties = {}) => {
	const { env, persist } = useEnvironmentContext();
	const { resetPlugins } = usePluginManagerContext();
	const { setConfiguration, profileIsSyncing, profileHasSyncedOnce } = useConfiguration();
	const { restoreProfile } = useProfileRestore();
	const profile = useProfileWatcher();

	const { shouldRestore, shouldSync, shouldMarkCompleted, setStatus, status, markAsRestored, resetStatuses } =
		useProfileSyncStatus();

	const { allJobs, syncProfileWallets } = useProfileJobs(profile);
	const { start, stop, runAll } = useSynchronizer(allJobs);
	const { setProfileTheme, resetTheme } = useTheme();
	const { setProfileAccentColor, resetAccentColor } = useAccentColor();
	const { setScreenshotProtection } = useScreenshotProtection();
	const { getErroredNetworks } = useProfileUtils(env);

	const history = useHistory();

	useProfileStatusWatcher({
		env,
		onProfileSyncComplete,
		onProfileSyncError: (erroredNetworks: string[], resetStatus) => {
			onProfileSyncError?.(erroredNetworks, () => {
				resetStatus();
				onProfileSyncStart?.();
				syncProfileWallets?.();
			});
		},
		profile,
	});

	useEffect(() => {
		const clearProfileSyncStatus = () => {
			if (status() === "idle") {
				return;
			}

			resetTheme();
			resetAccentColor();
			resetPlugins();

			resetStatuses(env.profiles().values());
			setConfiguration({ profileErroredNetworks: [] });

			stop({ clearTimers: true });
		};

		const syncProfile = async (profile?: Contracts.IProfile) => {
			if (!profile) {
				onProfileSignOut?.();
				return clearProfileSyncStatus();
			}

			if (profile.usesPassword()) {
				try {
					profile.password().get();
				} catch (error) {
					onProfileRestoreError?.(error);
					return;
				}
			}

			if (shouldRestore(profile)) {
				await restoreProfile(profile);

				setProfileTheme(profile);
				setProfileAccentColor(profile);
				setScreenshotProtection(profile);
			}

			if (shouldSync()) {
				setStatus("syncing");

				if (profile.wallets().count() > 0 && !profileHasSyncedOnce) {
					onProfileSyncStart?.();
				}

				try {
					await profile.sync();
					await persist();
					setStatus("synced");
				} catch {
					const { erroredNetworks } = getErroredNetworks(profile);
					if (erroredNetworks.length > 0) {
						onProfileSyncError?.(erroredNetworks, () => {
							onProfileSyncStart?.();
							syncProfileWallets?.();
						});
					}
				}
			}

			if (shouldMarkCompleted() && profileIsSyncing) {
				// for better performance no need to await
				runAll();

				// Start background jobs after initial sync
				start();

				setStatus("completed");
				setConfiguration({ profileHasSyncedOnce: true, profileIsSyncing: false });
			}
		};

		setTimeout(() => syncProfile(profile), 0);
	}, [
		env,
		resetAccentColor,
		resetTheme,
		resetPlugins,
		setProfileTheme,
		setProfileAccentColor,
		allJobs,
		profile,
		runAll,
		start,
		persist,
		setConfiguration,
		shouldMarkCompleted,
		shouldRestore,
		shouldSync,
		setStatus,
		profileIsSyncing,
		markAsRestored,
		restoreProfile,
		status,
		onProfileRestoreError,
		onProfileSyncError,
		onProfileSyncStart,
		onProfileSyncComplete,
		resetStatuses,
		history,
		setScreenshotProtection,
		onProfileSignOut,
		getErroredNetworks,
		syncProfileWallets,
		profileHasSyncedOnce,
		stop,
	]);

	return { profile, profileIsSyncing };
};
