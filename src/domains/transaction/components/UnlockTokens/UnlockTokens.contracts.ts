import { UnlockableBalance as SDKUnlockableBalance } from "@payvo/sdk/distribution/services"; // @TODO: refactor export path in sdk
import { Contracts } from "@payvo/sdk-profiles";

const POLLING_INTERVAL = 1000 * 60; // 1 min

enum Step {
	SelectStep,
	ReviewStep,
	AuthenticationStep,
	SummaryStep,
	ErrorStep,
}

interface UnlockableBalance extends SDKUnlockableBalance {
	id: string;
}

interface UnlockTokensFormState {
	fee: number;
	amount: number;
	selectedObjects: UnlockableBalance[];

	// authentication fields
	mnemonic: string | undefined;
	secondMnemonic: string | undefined;
	encryptionPassword: string | undefined;
	wif: string | undefined;
	privateKey: string | undefined;
	secret: string | undefined;
}

type UseUnlockableBalancesHook = (wallet: Contracts.IReadWriteWallet) => {
	items: UnlockableBalance[];
	loading: boolean;
	isFirstLoad: boolean;
};

export type { UnlockableBalance, UnlockTokensFormState, UseUnlockableBalancesHook };

export interface UnlockTokensModalProperties {
	profile: Contracts.IProfile;
	wallet: Contracts.IReadWriteWallet;
	onClose: () => void;
}

export { POLLING_INTERVAL, Step };
