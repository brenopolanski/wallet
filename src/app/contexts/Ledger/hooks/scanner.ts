import { uniqBy } from "@payvo/sdk-helpers";
import { Contracts } from "@payvo/sdk-profiles";
import { LedgerData } from "app/contexts/Ledger/contracts";
import { useLedgerContext } from "app/contexts/Ledger/Ledger";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";

import { scannerReducer } from "./scanner.state";

export const useLedgerScanner = (coin: string, network: string) => {
	const { setBusy, setIdle } = useLedgerContext();

	const [state, dispatch] = useReducer(scannerReducer, {
		selected: [],
		wallets: [],
	});

	const { selected, wallets, error } = state;

	const isSelected = useCallback((path: string) => selected.includes(path), [selected]);

	const selectedWallets = useMemo(() => wallets.filter((item) => selected.includes(item.path)), [selected, wallets]);
	const canRetry = !!error;

	const [isScanning, setIsScanning] = useState(false);
	const abortRetryReference = useRef<boolean>(false);

	const scan = useCallback(
		async (profile: Contracts.IProfile) => {
			setIsScanning(true);
			setBusy();
			abortRetryReference.current = false;

			try {
				const instance = profile.coins().set(coin, network);

				const lastImportedPath = profile
					.wallets()
					.values()
					.map((wallet) => wallet.data().get<string>(Contracts.WalletData.DerivationPath))
					.filter(Boolean)
					.sort()
					.reverse()[0];

				// @ts-ignore
				const wallets = await instance.ledger().scan({ startPath: lastImportedPath });
				const legacyWallets = await instance.ledger().scan({ useLegacy: true });

				const allWallets = { ...legacyWallets, ...wallets };

				let ledgerData: LedgerData[] = [];

				for (const [path, data] of Object.entries(allWallets)) {
					const address = data.address();

					/* istanbul ignore next */
					if (!profile.wallets().findByAddressWithNetwork(address, network)) {
						ledgerData.push({
							address,
							balance: data.balance().available.toHuman(),
							path,
						});
					}
				}

				ledgerData = uniqBy(ledgerData, (wallet) => wallet.address);

				if (abortRetryReference.current) {
					return;
				}

				dispatch({ payload: ledgerData, type: "success" });
			} catch (error) {
				dispatch({ error: error.message, type: "failed" });
			}

			setIdle();
			setIsScanning(false);
		},
		[coin, network, setBusy, setIdle],
	);

	const abortScanner = useCallback(() => {
		abortRetryReference.current = true;
		setIdle();
	}, [setIdle]);

	const toggleSelect = useCallback((path: string) => dispatch({ path, type: "toggleSelect" }), [dispatch]);
	const toggleSelectAll = useCallback(() => dispatch({ type: "toggleSelectAll" }), [dispatch]);

	return {
		abortScanner,
		canRetry,
		error,
		isScanning,
		isSelected,
		scan,
		selectedWallets,
		toggleSelect,
		toggleSelectAll,
		wallets,
	};
};
