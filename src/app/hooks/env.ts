import { sortBy } from "@arkecosystem/utils";
import { Contracts } from "@payvo/sdk-profiles";
import { Networks } from "@payvo/sdk";
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

	// TODO: allow to return `undefined`, now it's not supported by components
	// @ts-ignore
	return useMemo(() => {
		if (!profile || !walletId) {
			return undefined;
		}

		try {
			return profile.wallets().findById(walletId);
		} catch {
			return undefined;
		}
	}, [profile, walletId]);
};

export const useNetworks = () => {
	const activeProfile = useActiveProfile();

	return useMemo(() => {
		const results = activeProfile
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
	}, [activeProfile]);
};

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
