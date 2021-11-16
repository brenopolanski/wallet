import { Contracts } from "@payvo/sdk-profiles";
import { PluginHooks } from "plugins/core/internals/plugin-hooks";
import { PluginService, PluginServiceIdentifier } from "plugins/types";

export class ProfilePluginService implements PluginService {
	#profile: Contracts.IProfile | undefined;

	config() {
		return {
			accessor: "profile",
			id: PluginServiceIdentifier.Profile,
		};
	}

	boot(context: { hooks: PluginHooks }) {
		context.hooks.onProfileChange((profile) => (this.#profile = profile));
	}

	api() {
		return {
			id: () => this.#profile?.id(),
			// TODO: return ReadOnlyWallet[]
			wallets: () =>
				this.#profile
					?.wallets()
					.values()
					.map((wallet) => wallet.toObject()),
		};
	}
}
