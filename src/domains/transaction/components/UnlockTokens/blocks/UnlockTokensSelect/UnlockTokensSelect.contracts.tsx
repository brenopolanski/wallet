import { Contracts } from "@payvo/profiles";

import { UnlockableBalance } from "../../UnlockTokens.contracts";

export interface UnlockTokensSelectProperties {
	items: UnlockableBalance[];
	loading: boolean;
	wallet: Contracts.IReadWriteWallet;
	profile: Contracts.IProfile;
	onClose: () => void;
	onUnlock: () => void;
	isFirstLoad?: boolean;
}

export interface UnlockTokensRowProperties {
	loading: boolean;
	item: UnlockableBalance;
	ticker: string;
	checked: boolean;
	onToggle: () => void;
}