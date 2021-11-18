import { IPluginContainer, IPluginServiceRepository } from "./plugin.contracts";

export class PluginContainer implements IPluginContainer {
	#data = new Map();

	set<T>(key: "services" | "registry", service: T): void {
		this.#data.set(key, service);
	}

	services(): IPluginServiceRepository {
		return this.#data.get("services");
	}
}

export const container = new PluginContainer();
