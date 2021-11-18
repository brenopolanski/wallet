import { Contracts } from "@payvo/sdk-profiles";
import { useNetworks } from "app/hooks";
import { useWalletConfig } from "domains/dashboard/hooks";
import { useMemo } from "react";

import { FilterWalletsHookProperties } from "./models";

export const useWalletFilters = ({ profile }: { profile: Contracts.IProfile }) => {
	const { defaultConfiguration, setValue, walletsDisplayType, selectedNetworkIds, viewType } = useWalletConfig({
		profile,
	});

	const basicNetworks = useNetworks(profile);
	const allWalletsLength = profile.wallets().values().length;
	const networks = useMemo(
		() =>
			basicNetworks.map((network) => ({
				isSelected: selectedNetworkIds.includes(network.id()),
				network,
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[basicNetworks, selectedNetworkIds, allWalletsLength],
	);

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
