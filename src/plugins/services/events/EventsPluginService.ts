import { IPluginController, PluginService } from "plugins/core";
import { PluginServiceConfig, PluginServiceIdentifier } from "plugins/types";

export class EventsPluginService implements PluginService {
	config(): PluginServiceConfig {
		return {
			accessor: "events",
			id: PluginServiceIdentifier.Events,
		};
	}

	api(plugin: IPluginController): Record<string, Function> {
		return {
			on: plugin.hooks().on.bind(plugin.hooks()),
		};
	}
}
