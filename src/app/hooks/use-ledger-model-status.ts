import { WalletLedgerModel } from "@payvo/sdk-profiles/distribution/contracts";
import { useMemo } from "react";

export type LedgerModel = WalletLedgerModel.NanoS | WalletLedgerModel.NanoX;

interface ModelStatusProperties {
	connectedModel?: LedgerModel;
	supportedModels?: LedgerModel[];
}

export const useLedgerModelStatus = ({
	connectedModel,
	supportedModels = [WalletLedgerModel.NanoS, WalletLedgerModel.NanoX],
}: ModelStatusProperties) => {
	const isLedgerModelSupported = useMemo(() => {
		if (!connectedModel) {
			return false;
		}

		return supportedModels.includes(connectedModel);
	}, [connectedModel, supportedModels]);

	return { isLedgerModelSupported };
};
