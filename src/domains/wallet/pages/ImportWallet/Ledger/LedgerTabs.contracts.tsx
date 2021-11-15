import { Networks } from "@payvo/sdk";
import { Contracts } from "@payvo/sdk-profiles";
import { useLedgerScanner } from "app/contexts";

export enum LedgerTabStep {
	NetworkStep = 1,
	LedgerConnectionStep,
	LedgerScanStep,
	LedgerImportStep,
}

export interface LedgerTabsProperties {
	activeIndex?: LedgerTabStep;
	onClickEditWalletName: (wallet: Contracts.IReadWriteWallet) => void;
}

export interface LedgerTableProperties extends ReturnType<typeof useLedgerScanner> {
	network: Networks.Network;
}
