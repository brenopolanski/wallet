import { PluginServiceConfig } from "plugins/types";

import { IPluginController, IPluginServiceData, PluginService } from "./plugin.contracts";

export class PluginServiceData implements IPluginServiceData {
	#instance: PluginService;

	constructor(instance: PluginService) {
		this.#instance = instance;
	}

	instance<T extends PluginService>(): T {
		return this.#instance as T;
	}

	api(plugin: IPluginController): Record<string, Function> {
		return this.#instance.api(plugin);
	}

	config(): PluginServiceConfig {
		return this.#instance.config();
	}

	id(): string {
		return this.config().id;
	}

	accessor(): string {
		return this.config().accessor;
	}
}
