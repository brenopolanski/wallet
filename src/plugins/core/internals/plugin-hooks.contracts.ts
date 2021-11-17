import { Contracts } from "@payvo/sdk-profiles";

export type HandlerFunction = (...arguments_: any[]) => any;

export interface IPluginHooks {
	hasCommand(commandName: string): boolean;

	registerCommand(commandName: string, handler: HandlerFunction): void;

	executeCommand(commandName: string, ...arguments_: any[]): any;

	hasFilter(namespace: string, hookName: string): boolean;

	addFilter(namespace: string, hookName: string, handler: HandlerFunction): void;

	applyFilter<T = unknown>(
		namespace: string,
		hookName: string,
		content: T,
		properties?: Record<string, any>,
	): T | undefined;

	clearAll(): void;

	setProfile(profile: Contracts.IProfile): void;

	flushProfile(): void;

	onProfileChange(callback: (profile: Contracts.IProfile | undefined) => void): void;

	emit(event: string | symbol, ...arguments_: any[]): boolean;

	on(event: string | symbol, listener: (...arguments_: any[]) => void): this;
}
