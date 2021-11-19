import { sortByDesc } from "@payvo/sdk-helpers";
import { Contracts } from "@payvo/sdk-profiles";
import { AssetItem } from "domains/dashboard/components/PortfolioBreakdown/PortfolioBreakdown.contracts";
import { useMemo } from "react";
import { assertString } from "utils/assertions";

type UsePortfolioBreakdownHook = (input: { profile: Contracts.IProfile; profileIsSyncingExchangeRates: boolean }) => {
	assets: AssetItem[];
	balance: number;
	loading: boolean;
	ticker: string;
	walletsCount: number;
};

export const usePortfolioBreakdown: UsePortfolioBreakdownHook = ({ profile, profileIsSyncingExchangeRates }) => {
	const isRestored = profile.status().isRestored();
	const balance = profile.convertedBalance();

	const loading = useMemo<boolean>(
		() => !isRestored || profileIsSyncingExchangeRates,
		[isRestored, profileIsSyncingExchangeRates],
	);

	const ticker = useMemo<string>(
		() => {
			if (!isRestored) {
				return "";
			}

			const exchangeCurrency = profile.settings().get<string>(Contracts.ProfileSetting.ExchangeCurrency);
			assertString(exchangeCurrency);

			return exchangeCurrency;
		},
		[profile, isRestored], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const walletsCount = profile
		.wallets()
		.values()
		.filter((wallet) => wallet.network().isLive()).length;

	const assets = useMemo<AssetItem[]>(
		() =>
			sortByDesc(
				profile
					.portfolio()
					.breakdown()
					.map((asset) => ({
						amount: asset.source,
						convertedAmount: asset.target,
						label: asset.coin.network().ticker(),
						percent: asset.shares,
					})),
				(item) => item.percent,
			),
		[profile, loading], // eslint-disable-line react-hooks/exhaustive-deps
	);

	return {
		assets,
		balance,
		loading,
		ticker,
		walletsCount,
	};
};
