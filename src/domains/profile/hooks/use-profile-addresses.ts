import { Networks } from "@payvo/sdk";
import { Contracts } from "@payvo/sdk-profiles";
import { useMemo } from "react";

export interface AddressProperties {
	id: string;
	address: string;
	alias?: string;
	network?: string;
	avatar: string;
	type: string;
}

interface ProfileAddressesProperties {
	profile: Contracts.IProfile;
	network?: Networks.Network;
}

const isMultiSignature = (wallet: Contracts.IReadWriteWallet) => {
	try {
		return wallet.isMultiSignature();
	} catch {
		/* istanbul ignore next */
		return false;
	}
};

export const useProfileAddresses = (
	{ profile, network }: ProfileAddressesProperties,
	exceptMultiSignature?: boolean,
) => {
	const contacts = profile.contacts().values();
	const profileWallets = profile.wallets().values();

	return useMemo(() => {
		const allAddresses: AddressProperties[] = [];
		const profileAddresses: AddressProperties[] = [];
		const contactAddresses: AddressProperties[] = [];

		const isNetworkSelected = (addressNetwork: string) => {
			if (!network) {
				return true;
			}

			return addressNetwork === network.id();
		};

		for (const wallet of profileWallets) {
			if (!isNetworkSelected(wallet.network().id())) {
				continue;
			}

			if (exceptMultiSignature && isMultiSignature(wallet)) {
				continue;
			}

			const address = {
				address: wallet.address(),
				alias: wallet.alias(),
				avatar: wallet.avatar(),
				id: wallet.id(),
				network: wallet.network().id(),
				type: "wallet",
			};

			allAddresses.push(address);
			profileAddresses.push(address);
		}

		for (const contact of contacts) {
			for (const contactAddress of contact.addresses().values()) {
				if (!isNetworkSelected(contactAddress.network())) {
					continue;
				}

				if (exceptMultiSignature) {
					continue;
				}

				const addressAlreadyExist = allAddresses.some(({ address }) => address === contactAddress.address());
				if (addressAlreadyExist) {
					continue;
				}

				const address = {
					address: contactAddress.address(),
					alias: contact.name(),
					avatar: contactAddress.avatar(),
					id: contactAddress.id(),
					network: contactAddress.network(),
					type: "contact",
				};

				allAddresses.push(address);
				contactAddresses.push(address);
			}
		}

		return {
			allAddresses,
			contactAddresses,
			profileAddresses,
		};
	}, [network, profileWallets, exceptMultiSignature, contacts]);
};
