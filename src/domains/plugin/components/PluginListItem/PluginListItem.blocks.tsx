import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import cn from "classnames";
import React from "react";
import { useTranslation } from "react-i18next";

interface PluginLaunchButtonProperties {
	plugin: any;
	onLaunch?: (plugin: any) => void;
	isCompact?: boolean;
}

const PluginLaunchButton = ({ plugin, onLaunch, isCompact }: PluginLaunchButtonProperties) => {
	const { t } = useTranslation();

	const tooltipContent = () => {
		if (!plugin.isEnabled) {
			return t("PLUGINS.PLUGIN_INFO.NOT_ENABLED");
		}

		if (!plugin.hasLaunch) {
			return t("PLUGINS.PLUGIN_INFO.NOT_LAUNCHEABLE");
		}
	};

	const renderButtonContent = () => {
		if (plugin.isEnabled && plugin.hasLaunch) {
			return t("COMMON.LAUNCH");
		}

		if (isCompact) {
			return <span className="w-14 h-0.5 bg-theme-secondary-300 dark:bg-theme-secondary-700 rounded-full" />;
		}

		return <Icon name="Dash" size="lg" />;
	};

	const renderButton = () => {
		if (isCompact) {
			return (
				<span className="flex">
					<Button
						size="icon"
						variant="transparent"
						onClick={() => onLaunch?.(plugin)}
						disabled={!plugin.hasLaunch}
						className={cn("text-theme-primary-600 hover:text-theme-primary-700", {
							"-my-1": !plugin.hasLaunch,
						})}
						data-testid="PluginListItem__launch"
					>
						{renderButtonContent()}
					</Button>
				</span>
			);
		}

		return (
			<span className="flex w-full">
				<Button
					variant="secondary"
					onClick={() => onLaunch?.(plugin)}
					disabled={!plugin.hasLaunch}
					className="w-full"
					data-testid="PluginListItem__launch"
				>
					{renderButtonContent()}
				</Button>
			</span>
		);
	};

	return <Tooltip content={tooltipContent()}>{renderButton()}</Tooltip>;
};

export { PluginLaunchButton };
