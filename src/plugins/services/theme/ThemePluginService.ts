import { IPluginController, PluginService } from "plugins/core";
import { PluginServiceConfig, PluginServiceIdentifier } from "plugins/types";

export class ThemePluginService implements PluginService {
	config(): PluginServiceConfig {
		return {
			accessor: "theme",
			id: PluginServiceIdentifier.Theme,
		};
	}

	api(plugin: IPluginController): Record<string, Function> {
		return {
			decorate: plugin.hooks().addFilter.bind(plugin.hooks(), "service.theme"),
		};
	}
}
