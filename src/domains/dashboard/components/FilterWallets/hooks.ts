import { sortBy } from "@arkecosystem/utils";
import { Contracts } from "@payvo/profiles";
import { Networks } from "@payvo/sdk";
import { useWalletConfig } from "domains/dashboard/hooks";
import { useMemo } from "react";

import { FilterWalletsHookProperties } from ".";

export const useWalletFilters = ({ profile }: { profile: Contracts.IProfile }) => {
	const { defaultConfiguration, setValue, walletsDisplayType, selectedNetworkIds, viewType } = useWalletConfig({
		profile,
	});

	const allWalletsLength = profile.wallets().values().length;
	const networks = useMemo(() => {
		const networks: Record<string, { network: Networks.Network; isSelected: boolean }> = {};

		for (const wallet of profile.wallets().values()) {
			const networkId = wallet.networkId();

			if (!networks[networkId]) {
				networks[networkId] = {
					isSelected: selectedNetworkIds.includes(networkId),
					network: wallet.network(),
				};
			}
		}

		return sortBy(Object.values(networks), ({ network }) => network.displayName());
	}, [profile, selectedNetworkIds, allWalletsLength]); // eslint-disable-line react-hooks/exhaustive-deps

	const isFilterChanged = useMemo(() => {
		if (walletsDisplayType !== defaultConfiguration.walletsDisplayType) {
			return true;
		}

		if (selectedNetworkIds.length < defaultConfiguration.selectedNetworkIds.length) {
			return true;
		}

		return false;
	}, [walletsDisplayType, selectedNetworkIds, defaultConfiguration]);

	return useMemo<FilterWalletsHookProperties>(
		() => ({
			defaultConfiguration,
			disabled: !profile.wallets().count(),
			isFilterChanged,
			networks,
			selectedNetworkIds,
			update: setValue,
			useTestNetworks: profile.settings().get(Contracts.ProfileSetting.UseTestNetworks),
			viewType,
			walletsDisplayType,
		}),
		[
			walletsDisplayType,
			selectedNetworkIds,
			viewType,
			isFilterChanged,
			networks,
			profile,
			setValue,
			defaultConfiguration,
		],
	);
};
