import { PluginService } from "plugins/core";
import { PluginServiceConfig, PluginServiceIdentifier } from "plugins/types";

export class TimersPluginService implements PluginService {
	config(): PluginServiceConfig {
		return {
			accessor: "timers",
			id: PluginServiceIdentifier.Timers,
		};
	}

	api(): Record<string, Function> {
		return {
			clearInterval: this.clearInterval.bind(this),
			clearTimeout: this.clearTimeout.bind(this),
			setInterval: this.setInterval.bind(this),
			setTimeout: this.setTimeout.bind(this),
		};
	}

	private clearInterval(handle: number) {
		return clearInterval(handle);
	}

	private clearTimeout(handle: number) {
		return clearTimeout(handle);
	}

	private setInterval(handler: Function, timeout: number) {
		return setInterval(() => handler(), timeout);
	}

	private setTimeout(handler: Function, timeout: number) {
		return setTimeout(() => handler(), timeout);
	}
}
