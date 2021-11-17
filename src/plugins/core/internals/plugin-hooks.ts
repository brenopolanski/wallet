import { Contracts } from "@payvo/profiles";
import { EventEmitter } from "events";

import { HandlerFunction, IPluginHooks } from "./plugin-hooks.contracts";

const formatKey = (...arguments_: string[]) => arguments_.join(".");

export class PluginHooks extends EventEmitter implements IPluginHooks {
	#filters = new Map<string, HandlerFunction[]>();
	#commands = new Map<string, HandlerFunction>();

	hasCommand(commandName: string): boolean {
		return this.#commands.has(commandName);
	}

	registerCommand(commandName: string, handler: HandlerFunction): void {
		if (this.#commands.has(commandName)) {
			throw new Error(`Command ${commandName} already registered.`);
		}

		if (typeof handler !== "function") {
			throw new TypeError(`Expected handler to be a function, but found type '${typeof handler}'`);
		}

		this.#commands.set(commandName, handler);
	}

	executeCommand(commandName: string, ...arguments_: any[]): any {
		if (!this.#commands.has(commandName)) {
			throw new Error(`Command ${commandName} not found.`);
		}

		return this.#commands.get(commandName)?.(...arguments_);
	}

	hasFilter(namespace: string, hookName: string): boolean {
		return this.#filters.has(formatKey(namespace, hookName));
	}

	addFilter(namespace: string, hookName: string, handler: HandlerFunction): void {
		const key = formatKey(namespace, hookName);
		const current = this.#filters.get(key) || [];

		if (typeof handler !== "function") {
			throw new TypeError(`Expected handler to be a function, but found type '${typeof handler}'`);
		}

		current.push(handler);

		this.#filters.set(key, current);
	}

	applyFilter<T = unknown>(
		namespace: string,
		hookName: string,
		content: T,
		properties?: Record<string, any>,
	): T | undefined {
		const key = formatKey(namespace, hookName);

		if (!this.#filters.has(key)) {
			return;
		}

		return this.#filters.get(key)!.reduce((accumulator, handler) => handler(accumulator, properties), content);
	}

	clearAll(): void {
		this.#filters.clear();
		this.#commands.clear();
	}

	setProfile(profile: Contracts.IProfile): void {
		this.emit("profile", profile);
	}

	flushProfile(): void {
		this.emit("profile", undefined);
	}

	onProfileChange(callback: (profile: Contracts.IProfile | undefined) => void): void {
		this.on("profile", callback);
	}
}
