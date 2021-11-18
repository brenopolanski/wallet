import { IPluginController, PluginService } from "plugins/core";
import { PluginServiceConfig, PluginServiceIdentifier } from "plugins/types";

export class LaunchPluginService implements PluginService {
	config(): PluginServiceConfig {
		return {
			accessor: "launch",
			id: PluginServiceIdentifier.Launch,
		};
	}

	api(plugin: IPluginController): Record<string, Function> {
		return {
			render: (node: React.ReactNode) => plugin.hooks().registerCommand("service:launch.render", () => node),
		};
	}
}
