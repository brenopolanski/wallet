import { chunk } from "@arkecosystem/utils";
import { DropdownOption } from "app/components/Dropdown";
import { EmptyBlock } from "app/components/EmptyBlock";
import { Pagination } from "app/components/Pagination";
import cn from "classnames";
import { BlankPluginCard, PluginCard } from "domains/plugin/components/PluginCard";
import { PluginCardSkeleton } from "domains/plugin/components/PluginCard/PluginCardSkeleton";
import { PluginActionsProperties } from "domains/plugin/pages";
import { PluginCategories } from "domains/plugin/plugin.contracts";
import { ExtendedSerializedPluginConfigurationData, SerializedPluginConfigurationData } from "plugins";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";

type PluginGridProperties = {
	category?: PluginCategories;
	className?: string;
	emptyMessage?: string;
	isLoading?: boolean;
	itemsPerPage?: number;
	plugins: ExtendedSerializedPluginConfigurationData[];
	showPagination?: boolean;
	skeletonsLimit?: number;
	updatingStats?: Record<string, SerializedPluginConfigurationData>;
} & PluginActionsProperties;

export const PluginGrid = ({
	category,
	className,
	emptyMessage,
	isLoading,
	itemsPerPage = 15,
	plugins,
	showPagination = true,
	skeletonsLimit = 3,
	updatingStats,
	onDelete,
	onDisable,
	onEnable,
	onInstall,
	onLaunch,
	onSelect,
	onUpdate,
}: PluginGridProperties) => {
	const { t } = useTranslation();

	const [currentPage, setCurrentPage] = React.useState(1);

	let skeletons = [];

	if (isLoading) {
		skeletons = new Array(skeletonsLimit).fill({});
	}

	const getActions = useCallback(
		(plugin: ExtendedSerializedPluginConfigurationData) => {
			if (plugin.isInstalled) {
				const result: DropdownOption[] = [];

				if (plugin.hasLaunch) {
					result.push({ label: t("COMMON.LAUNCH"), value: "launch" });
				}

				if (plugin.updateStatus.isAvailable) {
					result.push({
						disabled: !plugin.updateStatus.isCompatible,
						label: t("COMMON.UPDATE"),
						value: "update",
					});
				}

				if (plugin.isEnabled) {
					result.push({ label: t("COMMON.DISABLE"), value: "disable" });
				} else {
					result.push({
						disabled: plugin.isCompatible === false,
						label: t("COMMON.ENABLE"),
						value: "enable",
					});
				}

				result.push({ label: t("COMMON.DELETE"), value: "delete" });

				return result;
			}

			return [
				{
					label: t("COMMON.INSTALL"),
					value: "install",
				},
			];
		},
		[t],
	);

	const handlePluginAction = (plugin: ExtendedSerializedPluginConfigurationData, action: DropdownOption) => {
		const actions = {
			delete: () => onDelete(plugin),
			disable: () => onDisable(plugin),
			enable: () => onEnable(plugin),
			install: () => onInstall(plugin),
			launch: () => onLaunch(plugin),
			update: () => onUpdate(plugin),
		};

		return actions[action.value as keyof typeof actions]();
	};

	if (isLoading) {
		return (
			<div data-testid="PluginGrid">
				<div className={cn("grid grid-cols-3 gap-4.5", className)}>
					{skeletons.map((_, index) => (
						<PluginCardSkeleton key={index} />
					))}
				</div>
			</div>
		);
	}

	if (plugins.length === 0) {
		return (
			<EmptyBlock data-testid="PluginGrid__empty-message">
				<Trans>{emptyMessage || t("PLUGINS.PAGE_PLUGIN_MANAGER.NO_PLUGINS_AVAILABLE")}</Trans>
			</EmptyBlock>
		);
	}

	const pagePlugins = chunk(plugins, itemsPerPage)[currentPage - 1];

	return (
		<div data-testid="PluginGrid">
			<div className={cn("grid grid-cols-3 gap-4.5", className)}>
				{pagePlugins.map((plugin: ExtendedSerializedPluginConfigurationData | undefined, index: number) =>
					plugin ? (
						<PluginCard
							key={plugin.id}
							actions={getActions(plugin)}
							plugin={plugin}
							isUpdating={updatingStats?.[plugin.id]?.percent !== undefined}
							updatingProgress={updatingStats?.[plugin.id]?.percent}
							onClick={() => onSelect(plugin)}
							onSelect={(action) => handlePluginAction(plugin, action)}
						/>
					) : (
						<BlankPluginCard key={`blank_${index}`} category={category} />
					),
				)}
			</div>

			{showPagination && (
				<div className="flex justify-center mt-10 w-full">
					<Pagination
						currentPage={currentPage}
						itemsPerPage={itemsPerPage}
						totalCount={plugins.length}
						onSelectPage={setCurrentPage}
					/>
				</div>
			)}
		</div>
	);
};
