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
		[loading], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const assets = useMemo<AssetItem[]>(() => {
		const values: Omit<AssetItem, "percent" | "percentFormatted">[] = Object.values(
			wallets.reduce<Record<string, Omit<AssetItem, "percent" | "percentFormatted">>>((assetsMap, wallet) => {
				const { amount = 0, convertedAmount = 0 } = assetsMap[wallet.currency()] ?? {};

				assetsMap[wallet.currency()] = {
					amount: amount + wallet.balance(),
					convertedAmount: convertedAmount + wallet.convertedBalance(),
					label: wallet.currency(),
				};

				return assetsMap;
			}, {}),
		);

		// Calculate percentages.
		return values.map((asset) => {
			const percent = (asset.amount * 100) / balance;
			const percentFormatted = `${Math.round((percent + Number.EPSILON) * 100) / 100}%`;

			return {
				...asset,
				percent,
				percentFormatted,
			};
		});
	}, [balance, wallets]);

	return {
		assets,
		balance,
		convertedBalance,
		loading,
		wallets,
	};
};
