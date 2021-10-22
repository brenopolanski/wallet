import { Badge } from "app/components/Badge";
import { Button } from "app/components/Button";
import { Dropdown, DropdownOption } from "app/components/Dropdown";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import cn from "classnames";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface PluginDropdownProperties {
	plugin: any;
	onEnable?: (plugin: any) => void;
	onDisable?: (plugin: any) => void;
	onUpdate?: (plugin: any) => void;
	onDelete?: (plugin: any) => void;
	isCompact?: boolean;
}

const PluginDropdown = ({ plugin, onDelete, onEnable, onDisable, onUpdate, isCompact }: PluginDropdownProperties) => {
	const { t } = useTranslation();

	const actions = useMemo(() => {
		const result: DropdownOption[] = [];

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
			result.push({ disabled: plugin.isCompatible === false, label: t("COMMON.ENABLE"), value: "enable" });
		}

		result.push({ label: t("COMMON.DELETE"), value: "delete" });

		return result;
	}, [t, plugin]);

	return (
		<Dropdown
			toggleContent={
				<div className="relative">
					<Button
						size="icon"
						variant={isCompact ? "transparent" : "secondary"}
						className={cn("text-left", {
							"text-theme-primary-600 hover:text-theme-primary-700 -mx-3": isCompact,
						})}
					>
						<Icon name="EllipsisVertical" size="lg" />
					</Button>
					{plugin.updateStatus.isAvailable && (
						<Tooltip content={t("PLUGINS.NEW_VERSION_AVAILABLE")}>
							<Badge
								data-testid="PluginDropdown__update-badge"
								size="sm"
								className={cn("cursor-pointer bg-theme-danger-400", { "mt-2 mr-1": isCompact })}
								position="top-right"
							/>
						</Tooltip>
					)}
				</div>
			}
			options={actions}
			onSelect={(option: any) => {
				if (option.value === "delete") {
					onDelete?.(plugin);
				}

				if (option.value === "enable") {
					return onEnable?.(plugin);
				}

				if (option.value === "disable") {
					return onDisable?.(plugin);
				}

				if (option.value === "update") {
					return onUpdate?.(plugin);
				}
			}}
			dropdownClass="text-left"
		/>
	);
};

export { PluginDropdown };
