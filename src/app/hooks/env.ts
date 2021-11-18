import { Networks } from "@payvo/sdk";
import { sortBy } from "@payvo/sdk-helpers";
import { Contracts } from "@payvo/sdk-profiles";
import { useEnvironmentContext } from "app/contexts/Environment";
import { useMemo } from "react";
import { useHistory, useParams } from "react-router-dom";

export const useActiveProfile = (): Contracts.IProfile => {
	const history = useHistory();

	const context = useEnvironmentContext();
	const { profileId } = useParams<{ profileId: string }>();

	return useMemo(() => {
		if (!profileId) {
			throw new Error(
				`Parameter [profileId] must be available on the route where [useActiveProfile] is called. Current route is [${history.location.pathname}].`,
			);
		}

		return context.env.profiles().findById(profileId);
	}, [context.env, history.location.pathname, profileId]);
};

export const useActiveWallet = (): Contracts.IReadWriteWallet => {
	const profile = useActiveProfile();
	const { walletId } = useParams<{ walletId: string }>();

	return useMemo(() => profile.wallets().findById(walletId), [profile, walletId]);
};

export const useNetworks = (profile: Contracts.IProfile) =>
	useMemo<Networks.Network[]>(() => {
		const results = profile
			.wallets()
			.values()
			.reduce<Record<string, Networks.Network>>(
				(accumulator, wallet) => ({
					...accumulator,
					[wallet.networkId()]: wallet.network(),
				}),
				{},
			);

		return sortBy(Object.values(results), (network) => network.displayName());
	}, [profile]);

export const useActiveWalletWhenNeeded = (isRequired: boolean) => {
	const profile = useActiveProfile();
	const { walletId } = useParams<{ walletId: string }>();

	return useMemo(() => {
		try {
			return profile.wallets().findById(walletId);
		} catch (error) {
			if (isRequired) {
				throw error;
			}

			return undefined;
		}
	}, [isRequired, profile, walletId]);
};
