import { Contracts } from "@payvo/sdk-profiles";
import { PluginAPI, PluginServiceConfig, PluginServiceIdentifier } from "plugins/types";

import { IPluginConfigurationData } from "./configuration";
import { IPluginHooks } from "./internals";

export interface IPluginController {
	hooks(): IPluginHooks;

	dir(): string | undefined;

	config(): IPluginConfigurationData;

	isEnabled(profile: Contracts.IProfile): boolean;

	enable(profile: Contracts.IProfile, options?: { autoRun?: true }): string;

	disable(profile: Contracts.IProfile): void;

	run(profile: Contracts.IProfile): void;

	dispose(): void;
}

export interface PluginService {
	config(): PluginServiceConfig;
	api(plugin: IPluginController): Record<string, Function>;
	boot?(context: { hooks: IPluginHooks }): void;
}

export interface IPluginServiceData {
	instance<T extends PluginService>(): T;

	api(plugin: IPluginController): Record<string, Function>;

	config(): PluginServiceConfig;

	id(): string;

	accessor(): string;
}

export interface IPluginServiceRepository {
	all(): Map<string, IPluginServiceData>;

	hooks(): IPluginHooks;

	api(plugin: IPluginController, profile: Contracts.IProfile): PluginAPI;

	boot(): void;

	register(services: PluginService[]): void;

	findById(id: PluginServiceIdentifier): IPluginServiceData | undefined;
}

export interface IPluginContainer {
	set<T>(key: "services" | "registry", service: T): void;

	services(): IPluginServiceRepository;
}
