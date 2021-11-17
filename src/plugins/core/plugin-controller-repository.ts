import * as PayvoIntl from "@payvo/sdk-intl";
import { Contracts } from "@payvo/sdk-profiles";
import { Alert } from "app/components/Alert";
import { OriginalButton } from "app/components/Button/OriginalButton";
import { Card } from "app/components/Card";
import { Checkbox } from "app/components/Checkbox";
import { Clipboard } from "app/components/Clipboard";
import { Icon } from "app/components/Icon";
import { Input, InputCurrency } from "app/components/Input";
import { Link } from "app/components/Link";
import { Modal } from "app/components/Modal";
import { Spinner } from "app/components/Spinner";
import { Table, TableCell, TableRow } from "app/components/Table";
import { TabPanel, Tabs } from "app/components/Tabs";
import { Tooltip } from "app/components/Tooltip";
import { Box } from "plugins/components/shared/Box";
import { runUnknownCode } from "plugins/loader/vm";
import { PluginRawInstance } from "plugins/types";

import { IPluginController } from "./plugin.contracts";
import { container } from "./plugin-container";
import { PluginController } from "./plugin-controller";

export class PluginControllerRepository {
	#plugins: IPluginController[] = [];
	#currentProfile: Contracts.IProfile | undefined;

	all(): IPluginController[] {
		return this.#plugins;
	}

	enabled(profile: Contracts.IProfile): IPluginController[] {
		return profile
			.plugins()
			.values()
			.filter((item) => item.isEnabled)
			.map((item) => this.findById(item.name))
			.filter(Boolean) as IPluginController[];
	}

	removeById(id: string, profile: Contracts.IProfile): void {
		const plugin = this.findById(id);

		if (plugin) {
			plugin.disable(profile);
			this.#plugins = this.#plugins.filter((plugin) => plugin.config().id() !== id);
		}
	}

	findById(id: string): IPluginController | undefined {
		return this.#plugins.find((item) => item.config().id() === id);
	}

	filterByCategory(category: string): IPluginController[] {
		return this.#plugins.filter((item) => item.config().categories().includes(category));
	}

	currentProfile(): Contracts.IProfile | undefined {
		return this.#currentProfile;
	}

	runAllEnabled(profile: Contracts.IProfile) {
		if (this.#currentProfile) {
			throw new Error(
				`Profile ${this.#currentProfile.id()} has the plugins running, call #dispose to close them first.`,
			);
		}

		container.services().hooks().setProfile(profile);

		for (const plugin of this.enabled(profile)) {
			try {
				plugin.run(profile);
			} catch {
				//
			}
		}

		this.#currentProfile = profile;
	}

	dispose() {
		if (!this.#currentProfile) {
			throw new Error(`No plugins running, call #boot to run them.`);
		}

		container.services().hooks().flushProfile();

		for (const plugin of this.#currentProfile.plugins().values()) {
			const ctrl = this.findById(plugin.id);
			ctrl?.dispose();
		}

		this.#plugins = [];
		this.#currentProfile = undefined;
	}

	push(instance: IPluginController): void {
		this.#plugins.push(instance);
	}

	fill(instances: PluginRawInstance[]): void {
		const plugins: Record<string, IPluginController> = {};

		for (const entry of instances) {
			try {
				const callback = runUnknownCode(entry.source.toString(), entry.sourcePath, {
					payvo: {
						Components: {
							Alert,
							Box,
							Button: OriginalButton,
							Card,
							Checkbox,
							Clipboard,
							Icon,
							Input,
							InputCurrency,
							Link,
							Modal,
							Spinner,
							TabPanel,
							Table,
							TableCell,
							TableRow,
							Tabs,
							Tooltip,
						},
					},
					sdk: {
						Intl: PayvoIntl,
					},
				});

				const plugin = new PluginController(entry.config, callback, entry.dir);

				plugin.config().validate();

				plugins[plugin.config().id()] = plugin;
			} catch (error) {
				console.error(`Failed to parse the plugin from "${entry.dir}".`, error.message);
			}
		}

		for (const [pluginId, plugin] of Object.entries(plugins)) {
			const currentIndex = this.#plugins.findIndex((item) => item.config().id() === pluginId);
			// Update existing plugin configuration
			if (currentIndex >= 0) {
				this.#plugins[currentIndex] = plugin;
				delete plugins[pluginId];
			}
		}

		this.#plugins.push(...Object.values(plugins));
	}

	// Helpers

	hasFilters(namespace: string, hookName: string): boolean {
		return this.#plugins.some((plugin) => plugin.hooks().hasFilter(namespace, hookName));
	}

	applyFilters<T>(namespace: string, hookName: string, content: T, properties?: Record<string, any>): T {
		const plugins = this.#plugins.filter((plugin) => plugin.hooks().hasFilter(namespace, hookName));

		if (plugins.length === 0) {
			return content;
		}

		return plugins.reduce(
			(accumulator, plugin) => plugin.hooks().applyFilter(namespace, hookName, accumulator, properties)!,
			content,
		);
	}
}
