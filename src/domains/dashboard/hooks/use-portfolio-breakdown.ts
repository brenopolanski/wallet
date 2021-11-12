import { Contracts } from "@payvo/profiles";
import { useMemo } from "react";

export interface AssetItem {
	amount: number;
	convertedAmount: number;
	label: string;
	percent: number;
}

type UsePortfolioBreakdownHook = (input: {
	profile: Contracts.IProfile;
	profileIsSyncingExchangeRates: boolean;
}) => {
	assets: AssetItem[];
	balance: number;
	convertedBalance: number;
	loading: boolean;
	ticker: string;
	walletsCount: number;
};

export const usePortfolioBreakdown: UsePortfolioBreakdownHook = ({ profile, profileIsSyncingExchangeRates }) => {
	const isRestored = profile.status().isRestored();

	const balance = profile.balance();
	const convertedBalance = profile.convertedBalance();

	const loading = useMemo<boolean>(() => !isRestored || profileIsSyncingExchangeRates, [
		isRestored,
		profileIsSyncingExchangeRates,
	]);

	const ticker = useMemo<string>(
		() => profile.settings().get<string>(Contracts.ProfileSetting.ExchangeCurrency) ?? "",
		[profile, isRestored], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const walletsCount = useMemo<number>(
		() =>
			profile
				.wallets()
				.values()
				.filter((wallet) => wallet.network().isLive()).length,
		[profile, isRestored], // eslint-disable-line react-hooks/exhaustive-deps
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
				})),
		[profile, loading], // eslint-disable-line react-hooks/exhaustive-deps
	);

	return {
		assets,
		balance,
		convertedBalance,
		loading,
		ticker,
		walletsCount,
	};
};
