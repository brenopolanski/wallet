import { Contracts } from "@payvo/profiles";
import { useMemo } from "react";

export interface AssetItem {
	label: string;
	amount: number;
	convertedAmount: number;
	percent: number;
	percentFormatted: string;
}

type UsePortfolioBreakdownHook = (input: {
	profile: Contracts.IProfile;
	profileIsSyncingExchangeRates: boolean;
}) => {
	loading: boolean;
	balance: number;
	convertedBalance: number;
	assets: AssetItem[];
	wallets: Contracts.IReadWriteWallet[];
};

export const usePortfolioBreakdown: UsePortfolioBreakdownHook = ({ profile, profileIsSyncingExchangeRates }) => {
	const isRestored = profile.status().isRestored();

	const balance = profile.balance();
	const convertedBalance = profile.convertedBalance();

	const loading = useMemo<boolean>(() => !isRestored || profileIsSyncingExchangeRates, [
		isRestored,
		profileIsSyncingExchangeRates,
	]);

	const wallets = useMemo<Contracts.IReadWriteWallet[]>(
		() =>
			profile
				.wallets()
				.values()
				.filter((wallet) => wallet.network().isLive()),
		[profile, loading], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const assets = useMemo<AssetItem[]>(
		() =>
			profile
				.portfolio()
				.breakdown()
				.map((asset) => ({
					amount: asset.source,
					convertedAmount: asset.target,
					label: asset.coin.network().ticker(),
					percent: asset.shares,
					percentFormatted: `${Math.round((asset.shares + Number.EPSILON) * 100) / 100}%`,
				})),
		[profile, loading], // eslint-disable-line react-hooks/exhaustive-deps
	);

	return {
		assets,
		balance,
		convertedBalance,
		loading,
		wallets,
	};
};
