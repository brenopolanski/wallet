import { Button } from "app/components/Button";
import { Divider } from "app/components/Divider";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import { OfficialPluginIcon } from "domains/plugin/components/OfficialPluginIcon";
import { PluginDropdown } from "domains/plugin/components/PluginDropdown";
import { PluginUpdateStatus } from "plugins/types";
import React from "react";
import { useTranslation } from "react-i18next";

import { PluginImage } from "../PluginImage";
import { PluginSpecs } from "./components/PluginSpecs";

interface Properties {
	title?: string;
	description?: string;
	logo?: string;
	author?: string;
	category: string;
	url?: string;
	version?: string;
	size?: string;
	isInstalled?: boolean;
	isOfficial?: boolean;
	isEnabled?: boolean;
	updateStatus: PluginUpdateStatus;
	isCompatible?: boolean;
	onReport?: () => void;
	onInstall?: () => void;
	hasLaunch?: boolean;
	onLaunch?: () => void;
	onDelete?: () => void;
	onEnable?: () => void;
	onDisable?: () => void;
	onUpdate?: () => void;
	updatingStats?: any;
	isLoadingSize?: boolean;
}

export const PluginHeader = ({
	onDelete,
	onLaunch,
	onInstall,
	onReport,
	onEnable,
	onDisable,
	onUpdate,
	updatingStats,
	...properties
}: Properties) => {
	const { t } = useTranslation();

	const getPluginButtons = () => {
		if (properties.isInstalled) {
			return (
				<div className="flex items-center space-x-3">
					{properties.hasLaunch && (
						<Button data-testid="PluginHeader__button--launch" onClick={onLaunch}>
							{t("COMMON.LAUNCH")}
						</Button>
					)}

					<Tooltip content={t("PLUGINS.PLUGIN_INFO.REPORT")}>
						<Button data-testid="PluginHeader__button--report" variant="secondary" onClick={onReport}>
							<Icon name="CircleExclamationMark" size="lg" />
						</Button>
					</Tooltip>

					<PluginDropdown
						plugin={properties}
						onDelete={onDelete}
						onEnable={onEnable}
						onDisable={onDisable}
						onUpdate={onUpdate}
					/>
				</div>
			);
		}

		return (
			<>
				<Button data-testid="PluginHeader__button--install" onClick={onInstall}>
					{t("COMMON.INSTALL")}
				</Button>

				<Tooltip content={t("PLUGINS.PLUGIN_INFO.REPORT")}>
					<Button
						className="ml-3"
						onClick={onReport}
						data-testid="PluginHeader__button--report"
						variant="secondary"
					>
						<Icon name="CircleExclamationMark" size="lg" />
					</Button>
				</Tooltip>
			</>
		);
	};

	return (
		<div data-testid="plugin-details__header" className="w-full bg-theme-background">
			<div className="flex w-full">
				<PluginImage
					size="xl"
					logoURL={properties.logo}
					isUpdating={updatingStats?.percent !== undefined}
					updatingProgress={updatingStats?.percent}
					showUpdatingLabel
				/>

				<div className="flex flex-col justify-between pl-8 w-full min-w-0">
					<div className="flex justify-between items-end">
						<div className="flex overflow-hidden flex-col mr-8 space-y-2 leading-tight">
							<div className="flex items-center space-x-2">
								<span className="text-2xl font-bold truncate">{properties.title}</span>
								{properties.isOfficial && <OfficialPluginIcon size="lg" />}
							</div>
							<span className="text-medium text-theme-secondary-500 truncate">
								{properties.description}
							</span>
						</div>
						<div className="flex">{getPluginButtons()}</div>
					</div>

					<Divider dashed />

					<PluginSpecs {...properties} />
				</div>
			</div>
		</div>
	);
};

PluginHeader.defaultProps = {
	isLoadingSize: false,
};
