import { Contracts, Profile } from "@payvo/profiles";
import { ReadOnlyWallet } from "@payvo/profiles/distribution/read-only-wallet";
import { Wallet } from "@payvo/profiles/distribution/wallet";
import { Coins, Networks } from "@payvo/sdk";
import { AssertionError } from "assert";
import { PluginController } from "plugins";

export function assertProfile(profile?: Contracts.IProfile): asserts profile is Profile {
	if (!(profile instanceof Profile)) {
		throw new AssertionError({
			message: `Expected 'profile' to be Contracts.IProfile, but received ${profile}`,
		});
	}
}

export function assertWallet(wallet?: Contracts.IReadWriteWallet): asserts wallet is Wallet {
	if (!(wallet instanceof Wallet)) {
		throw new AssertionError({
			message: `Expected 'wallet' to be Contracts.IReadWriteWallet, but received ${wallet}`,
		});
	}
}

export function assertReadOnlyWallet(wallet?: Contracts.IReadOnlyWallet): asserts wallet is ReadOnlyWallet {
	if (!(wallet instanceof ReadOnlyWallet)) {
		throw new AssertionError({
			message: `Expected 'wallet' to be Contracts.IReadOnlyWallet, but received ${wallet}`,
		});
	}
}

export function assertCoin(coin?: Coins.Coin): asserts coin is Coins.Coin {
	if (!(coin instanceof Coins.Coin)) {
		throw new AssertionError({
			message: `Expected 'coin' to be Coins.Coin, but received ${coin}`,
		});
	}
}

export function assertNetwork(network?: Networks.Network): asserts network is Networks.Network {
	if (!(network instanceof Networks.Network)) {
		throw new AssertionError({
			message: `Expected 'network' to be Networks.Network, but received ${network}`,
		});
	}
}

export function assertArray(value: unknown): asserts value is NonNullable<any[]> {
	if (!Array.isArray(value)) {
		throw new AssertionError({
			message: `Expected 'value' to be array, but received ${value}`,
		});
	}
}

export function assertString(value: unknown): asserts value is NonNullable<string> {
	if (typeof value !== "string" || value.trim() === "") {
		throw new AssertionError({
			message: `Expected 'value' to be string, but received ${value}`,
		});
	}
}

export function assertNumber(value: unknown): asserts value is NonNullable<number> {
	if (typeof value !== "number" || value > Number.MAX_SAFE_INTEGER || Number.isNaN(value)) {
		throw new AssertionError({
			message: `Expected 'value' to be number, but received ${value}`,
		});
	}
}

export function assertPluginController(
	pluginController?: PluginController,
): asserts pluginController is PluginController {
	if (!(pluginController instanceof PluginController)) {
		throw new AssertionError({
			message: `Expected 'pluginController' to be PluginController, but received ${pluginController}`,
		});
	}
}
