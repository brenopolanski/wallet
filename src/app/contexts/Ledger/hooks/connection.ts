import LedgerTransportNodeHID from "@ledgerhq/hw-transport-node-hid-singleton";
import { Coins } from "@payvo/sdk";
import { Contracts } from "@payvo/sdk-profiles";
import { WalletData } from "@payvo/sdk-profiles/distribution/contracts";
import { useEnvironmentContext } from "app/contexts/Environment";
import { LedgerData, minVersionList } from "app/contexts/Ledger/contracts";
import { formatLedgerDerivationPath } from "app/contexts/Ledger/utils/format-ledger-derivation-path";
import { toasts } from "app/services";
import retry from "async-retry";
import { getDefaultAlias } from "domains/wallet/utils/get-default-alias";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import semver from "semver";

import { connectionReducer, defaultConnectionState } from "./connection.state";

export const useLedgerConnection = (transport: typeof LedgerTransportNodeHID) => {
	const { t } = useTranslation();

	const { persist } = useEnvironmentContext();
	const [state, dispatch] = useReducer(connectionReducer, defaultConnectionState);
	const abortRetryReference = useRef<boolean>(false);

	const [deviceName, setDeviceName] = useState<string | undefined>();

	const { isBusy, isConnected, error } = state;

	useEffect(() => {
		if (deviceName) {
			if (isConnected) {
				toasts.success(t("COMMON.LEDGER_CONNECTED", { device: deviceName }));
			} else {
				toasts.warning(t("COMMON.LEDGER_DISCONNECTED", { device: deviceName }));
			}
		}
	}, [isConnected, t]); // eslint-disable-line react-hooks/exhaustive-deps

	const listenDevice = useCallback(
		() =>
			transport.listen({
				complete: () => void 0,

				error: (e) => dispatch({ message: e.message, type: "failed" }),
				// @ts-ignore
				next: ({ type, descriptor, deviceModel }) => {
					setDeviceName(deviceModel?.productName);

					if (type === "add") {
						dispatch({ id: deviceModel?.id || "nanoS", path: descriptor, type: "add" });
						return;
					}

					dispatch({ type: "remove" });
				},
			}),
		[transport],
	);

	const importLedgerWallets = useCallback(
		async (wallets: LedgerData[], coin: Coins.Coin, profile: Contracts.IProfile) => {
			for (const { address, path } of wallets) {
				const wallet = await profile.walletFactory().fromAddressWithDerivationPath({
					address,
					coin: coin.network().coin(),
					network: coin.network().id(),
					path,
				});

				profile.wallets().push(wallet);

				wallet.mutator().alias(
					getDefaultAlias({
						network: wallet.network(),
						profile,
					}),
				);

				wallet.data().set(WalletData.LedgerModel, state.device?.id);
			}
			await persist();
		},
		[persist, state],
	);

	const connect = useCallback(
		async (
			profile: Contracts.IProfile,
			coin: string,
			network: string,
			retryOptions: retry.Options = { factor: 1, randomize: false, retries: 50 },
		) => {
			dispatch({ type: "waiting" });
			abortRetryReference.current = false;

			const instance = profile.coins().set(coin, network);

			try {
				const slip44 = instance.config().get<number>("network.constants.slip44");

				const connectFunction: retry.RetryFunction<void> = async (bail, attempts) => {
					if (abortRetryReference.current && attempts > 1) {
						bail(new Error(t("WALLETS.MODAL_LEDGER_WALLET.GENERIC_CONNECTION_ERROR")));
					}

					await instance.__construct();
					await instance.ledger().connect(transport);

					if (minVersionList[coin]) {
						const currentVersion = await instance.ledger().getVersion();

						if (semver.lt(currentVersion, minVersionList[coin])) {
							bail(
								new Error(
									t("WALLETS.MODAL_LEDGER_WALLET.UPDATE_ERROR", { coin, version: currentVersion }),
								),
							);
						}
					}

					// Ensure that the app is accessible
					await instance.ledger().getPublicKey(formatLedgerDerivationPath({ coinType: slip44 }));
				};

				await retry(connectFunction, retryOptions);
				dispatch({ type: "connected" });
			} catch (connectError) {
				const errorMessage =
					connectError.statusText === "UNKNOWN_ERROR"
						? t("WALLETS.MODAL_LEDGER_WALLET.GENERIC_CONNECTION_ERROR")
						: connectError.message;

				try {
					await instance.ledger().disconnect();
				} catch {
					//
				}
				dispatch({ message: errorMessage, type: "failed" });
				throw connectError;
			}
		},
		[t, transport],
	);

	const disconnect = useCallback(async (coin: Coins.Coin) => {
		await coin.ledger().disconnect();
		dispatch({ type: "disconnected" });
	}, []);

	const setBusy = useCallback(() => dispatch({ type: "busy" }), []);
	const setIdle = useCallback(() => dispatch({ type: "connected" }), []);

	const abortConnectionRetry = useCallback(() => (abortRetryReference.current = true), []);
	const isAwaitingConnection = useMemo(() => state.isWaiting && !state.isConnected, [state]);
	const isAwaitingDeviceConfirmation = useMemo(() => state.isWaiting && state.isConnected, [state]);
	const hasDeviceAvailable = useMemo(() => !!state.device, [state]);

	useEffect(() => {
		const subscription = listenDevice();
		return () => {
			subscription?.unsubscribe();
		};
	}, [listenDevice]);

	return {
		abortConnectionRetry,
		connect,
		disconnect,
		dispatch,
		error,
		hasDeviceAvailable,
		importLedgerWallets,
		isAwaitingConnection,
		isAwaitingDeviceConfirmation,
		isBusy,
		isConnected,
		ledgerDevice: state.device,
		setBusy,
		setIdle,
		transport,
	};
};
