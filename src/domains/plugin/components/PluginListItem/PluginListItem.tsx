import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { TableCell, TableRow } from "app/components/Table";
import { Tooltip } from "app/components/Tooltip";
import cn from "classnames";
import { OfficialPluginIcon } from "domains/plugin/components/OfficialPluginIcon";
import { PluginDropdown } from "domains/plugin/components/PluginDropdown";
import React from "react";
import { useTranslation } from "react-i18next";

import { PluginImage } from "../PluginImage";
import { PluginLaunchButton } from "./PluginListItem.blocks";

interface PluginListItemProperties {
	onDelete?: (plugin: any) => void;
	onInstall: any;
	onLaunch?: (plugin: any) => void;
	onEnable?: (plugin: any) => void;
	onDisable?: (plugin: any) => void;
	onUpdate?: (plugin: any) => void;
	onClick?: (plugin: any) => void;
	isUpdating?: boolean;
	updatingProgress?: any;
	plugin: any;
	showCategory?: boolean;
	isCompact?: boolean;
}

export const PluginListItem = ({
	onDelete,
	onInstall,
	onEnable,
	onDisable,
	onLaunch,
	onUpdate,
	onClick,
	isUpdating,
	updatingProgress,
	plugin,
	showCategory,
	isCompact = false,
}: PluginListItemProperties) => {
	const { t } = useTranslation();

	const handleInstall = () => {
		onInstall?.(plugin);
	};

	const renderPluginButtons = () => {
		if (!plugin.isInstalled) {
			return (
				<Button
					size={isCompact ? "icon" : undefined}
					variant={isCompact ? "transparent" : "secondary"}
					className={cn(
						{ "flex-1": !isCompact },
						{ "text-theme-primary-600 hover:text-theme-primary-700 -mr-3": isCompact },
					)}
					onClick={handleInstall}
					data-testid="PluginListItem__install"
				>
					{t("COMMON.INSTALL")}
				</Button>
			);
		}

		return (
			<div className={cn("flex items-center justify-end w-full space-x-2")}>
				<PluginLaunchButton plugin={plugin} onLaunch={onLaunch} isCompact={isCompact} />
				<PluginDropdown
					plugin={plugin}
					onDelete={onDelete}
					onEnable={onEnable}
					onDisable={onDisable}
					onUpdate={onUpdate}
					isCompact={isCompact}
				/>
			</div>
		);
	};

	return (
		<TableRow>
			<TableCell
				variant="start"
				innerClassName={cn({ "space-x-3": isCompact }, { "space-x-5": !isCompact })}
				isCompact={isCompact}
			>
				<PluginImage
					size={isCompact ? "2xs" : "sm"}
					logoURL={plugin.logo}
					isUpdating={isUpdating}
					updatingProgress={updatingProgress}
				/>

				<div className="flex items-center space-x-2 text-left">
					<span
						data-testid="PluginListItem__link"
						onClick={() => onClick?.(plugin)}
						className="font-semibold link truncate max-w-88"
					>
						{plugin.title}
					</span>

					{plugin.isOfficial && <OfficialPluginIcon />}

					{plugin.updateStatus.isAvailable && !plugin.updateStatus.isCompatible && (
						<Tooltip
							content={t("PLUGINS.MINIMUM_VERSION_NOT_SATISFIED", {
								minimumVersion: plugin.minimumVersion,
							})}
						>
							<span data-testid="PluginListItem__minimum-version-warning" className="ml-3 text-xl">
								<Icon name="CircleExclamationMark" className="text-theme-warning-500" />
							</span>
						</Tooltip>
					)}
				</div>
			</TableCell>

			<TableCell isCompact={isCompact}>
				<span className="w-50 text-theme-secondary-text truncate">{plugin.author}</span>
			</TableCell>

			{showCategory && (
				<TableCell isCompact={isCompact}>
					<span className="text-theme-secondary-text">
						{t(`PLUGINS.CATEGORIES.${plugin.category.toUpperCase()}`)}
					</span>
				</TableCell>
			)}

			<TableCell isCompact={isCompact}>
				<span className="w-30 text-theme-secondary-text truncate">{plugin.version}</span>
			</TableCell>

			<TableCell isCompact={isCompact}>
				<span className="text-theme-secondary-text">{plugin.size}</span>
			</TableCell>

			<TableCell isCompact={isCompact}>
				{plugin.isInstalled ? (
					<>
						{plugin.isEnabled ? (
							<Tooltip content={t("PLUGINS.STATUS.ENABLED")}>
								<div
									data-testid="PluginListItem__enabled"
									className="mx-auto text-2xl text-theme-success-500"
								>
									<Icon name="CircleCheckMark" size="lg" />
								</div>
							</Tooltip>
						) : (
							<Tooltip content={t("PLUGINS.STATUS.DISABLED")}>
								<div
									data-testid="PluginListItem__disabled"
									className="mx-auto text-2xl text-theme-danger-400"
								>
									<Icon name="CircleCross" size="lg" />
								</div>
							</Tooltip>
						)}
					</>
				) : (
					<Tooltip content={t("PLUGINS.STATUS.NOT_INSTALLED")}>
						<div
							data-testid="PluginListItem__not-installed"
							className="flex justify-center items-center mx-auto w-6 h-6 text-theme-secondary-500"
						>
							<Icon name="Dash" size="lg" />
						</div>
					</Tooltip>
				)}
			</TableCell>

			<TableCell variant="end" innerClassName="justify-end" isCompact={isCompact}>
				{renderPluginButtons()}
			</TableCell>
		</TableRow>
	);
};

PluginListItem.defaultProps = {
	updatingProgress: 0,
};
