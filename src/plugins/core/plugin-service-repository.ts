import { Contracts } from "@payvo/sdk-profiles";
import { PluginAPI, PluginServiceIdentifier } from "plugins/types";

import {
	applyPluginMiddlewares,
	IPluginHooks,
	isServiceDefinedInConfig,
	isServiceEnabled,
	PluginHooks,
} from "./internals";
import { IPluginController, IPluginServiceData, IPluginServiceRepository, PluginService } from "./plugin.contracts";
import { PluginServiceData } from "./plugin-service";

export class PluginServiceRepository implements IPluginServiceRepository {
	#services: Map<string, IPluginServiceData> = new Map();
	readonly #hooks: IPluginHooks;

	constructor() {
		this.#hooks = new PluginHooks();
	}

	all(): Map<string, IPluginServiceData> {
		return this.#services;
	}

	hooks(): IPluginHooks {
		return this.#hooks;
	}

	api(plugin: IPluginController, profile: Contracts.IProfile): PluginAPI {
		const result = {};

		for (const service of this.#services.values()) {
			const guard = applyPluginMiddlewares({ plugin, profile, service }, [
				isServiceEnabled,
				isServiceDefinedInConfig,
			]);
			const accessor = service.accessor();
			// @ts-ignore
			result[accessor] = guard(() => service.api(plugin));
		}

		return result as PluginAPI;
	}

	boot(): void {
		for (const service of this.#services.values()) {
			service.instance().boot?.({
				hooks: this.hooks(),
			});
		}
	}

	register(services: PluginService[]): void {
		for (const service of services) {
			const data = new PluginServiceData(service);
			this.#services.set(data.id(), data);
		}
	}

	findById(id: PluginServiceIdentifier): IPluginServiceData | undefined {
		return this.#services.get(id);
	}
}
