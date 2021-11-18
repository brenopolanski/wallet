import { Contracts } from "@payvo/sdk-profiles";
import { PluginAPI } from "plugins/types";

import { IPluginConfigurationData, PluginConfigurationData } from "./configuration";
import { applyPluginMiddlewares, IPluginHooks, isPluginEnabled, PluginHooks } from "./internals";
import { IPluginController } from "./plugin.contracts";
import { container } from "./plugin-container";

type Callback = (api: PluginAPI) => void;

export class PluginController implements IPluginController {
	#hooks: IPluginHooks;

	#config: IPluginConfigurationData;
	#callback: Callback;
	#dir: string | undefined;

	constructor(config: Record<string, any>, callback: Callback, dir?: string) {
		this.#hooks = new PluginHooks();
		this.#dir = dir;
		this.#config = PluginConfigurationData.make(config, dir);
		this.#callback = callback;
	}

	hooks(): IPluginHooks {
		return this.#hooks;
	}

	dir(): string | undefined {
		return this.#dir;
	}

	config(): IPluginConfigurationData {
		return this.#config;
	}

	isEnabled(profile: Contracts.IProfile): boolean {
		return !!this.pluginData(profile);
	}

	// TODO: Better integration with SDK
	enable(profile: Contracts.IProfile, options?: { autoRun?: true }): string {
		/* istanbul ignore next */
		if (options?.autoRun) {
			this.run(profile);
		}

		// @ts-ignore
		const { id } = profile.plugins().push({
			isEnabled: true,
			name: this.config().name(),
			permissions: this.config().permissions(),
			urls: this.config().urls(),
			version: this.config().version(),
		});

		return id;
	}

	disable(profile: Contracts.IProfile): void {
		if (this.isEnabled(profile)) {
			profile.plugins().forget(this.pluginData(profile)!.id);
			this.dispose();
		}
	}

	run(profile: Contracts.IProfile): void {
		const pluginAPI = container.services().api(this, profile);
		const guard = applyPluginMiddlewares({ plugin: this, profile }, [isPluginEnabled]);

		// @ts-ignore
		const function_ = this.#callback?.default || this.#callback;
		guard(function_?.(pluginAPI));
		this.#hooks.emit("activated");
	}

	dispose(): void {
		this.#hooks.clearAll();
		this.#hooks.emit("deactivated");
	}

	private pluginData(profile: Contracts.IProfile) {
		return profile
			.plugins()
			.values()
			.find((item) => item.name === this.config().name());
	}
}
