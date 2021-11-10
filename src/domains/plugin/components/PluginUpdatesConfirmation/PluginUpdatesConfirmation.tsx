import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { Image } from "app/components/Image";
import { Modal } from "app/components/Modal";
import { Table, TableCell, TableRow } from "app/components/Table";
import { Tooltip } from "app/components/Tooltip";
import { OfficialPluginIcon } from "domains/plugin/components/OfficialPluginIcon";
import { PluginImage } from "domains/plugin/components/PluginImage";
import { ExtendedSerializedPluginConfigurationData } from "plugins/types";
import React, { FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Column, TableState } from "react-table";

import { PluginUpdatesConfirmationProperties } from "./PluginUpdatesConfirmation.contracts";

export const PluginUpdatesConfirmation: FC<PluginUpdatesConfirmationProperties> = ({
	isOpen,
	plugins,
	onClose,
	onContinue,
}) => {
	const { t } = useTranslation();

	const columns = useMemo<Column<ExtendedSerializedPluginConfigurationData>[]>(
		() => [
			{
				Header: t("COMMON.NAME"),
				accessor: "name",
			},
			{
				Header: t("PLUGINS.STATUS.COMPATIBLE"),
				accessor: (originalRow) => originalRow.updateStatus.isCompatible,
				cellWidth: "w-30",
				className: "justify-center",
				disableSortBy: true,
			},
			{
				Header: t("PLUGINS.REQUIRED_VERSION"),
				accessor: (originalRow) => originalRow.updateStatus.minimumVersion,
				cellWidth: "w-36",
				className: "justify-end whitespace-nowrap",
			},
		],
		[t],
	);

	const initialState = useMemo<Partial<TableState<ExtendedSerializedPluginConfigurationData>>>(
		() => ({
			sortBy: [
				{
					id: "name",
				},
			],
		}),
		[],
	);

	const hasIncompatibleUpdates = plugins.some((plugin) => !plugin.updateStatus.isCompatible);

	const getDescription = () => {
		if (hasIncompatibleUpdates) {
			return t("PLUGINS.MODAL_UPDATES_CONFIRMATION.DESCRIPTION_INCOMPATIBLE");
		}

		return t("PLUGINS.MODAL_UPDATES_CONFIRMATION.DESCRIPTION_COMPATIBLE");
	};

	const renderTableRow = useCallback(
		(pluginData: ExtendedSerializedPluginConfigurationData) => {
			const renderCompatibilityIcon = () => {
				if (pluginData.updateStatus.isCompatible) {
					return (
						<Tooltip content={t("PLUGINS.STATUS.COMPATIBLE")}>
							<div
								data-testid="PluginUpdates__compatible"
								className="mx-auto text-2xl text-theme-success-500"
							>
								<Icon name="CircleCheckMark" size="lg" />
							</div>
						</Tooltip>
					);
				}

				return (
					<Tooltip content={t("PLUGINS.STATUS.INCOMPATIBLE")}>
						<div
							data-testid="PluginUpdates__incompatible"
							className="mx-auto text-2xl text-theme-danger-400"
						>
							<Icon name="CircleCross" size="lg" />
						</div>
					</Tooltip>
				);
			};

			return (
				<TableRow>
					<TableCell variant="start" innerClassName="space-x-4">
						<PluginImage logoURL={pluginData.logo} size="xs" />

						<div className="flex items-center space-x-2">
							<span data-testid="PluginUpdates__title" className="font-semibold link max-w-60 truncate">
								{pluginData.title}
							</span>

							{pluginData.isOfficial && <OfficialPluginIcon />}
						</div>
					</TableCell>

					<TableCell>{renderCompatibilityIcon()}</TableCell>

					<TableCell variant="end" innerClassName="justify-end">
						<span data-testid="PluginUpdates__minimum-version">
							{pluginData.updateStatus.minimumVersion}
						</span>
					</TableCell>
				</TableRow>
			);
		},
		[t],
	);

	return (
		<Modal
			title={t("PLUGINS.MODAL_UPDATES_CONFIRMATION.TITLE")}
			image={<Image name="GenericWarning" className="m-auto my-8 w-3/5" />}
			description={getDescription()}
			isOpen={isOpen}
			onClose={onClose}
		>
			<div data-testid="PluginUpdatesConfirmation" className="mt-5">
				<Table data={plugins} columns={columns} initialState={initialState}>
					{renderTableRow}
				</Table>

				<div className="flex justify-end mt-8 space-x-3">
					<Button variant="secondary" onClick={onClose} data-testid="PluginUpdates__cancel-button">
						{t("COMMON.CANCEL")}
					</Button>

					<Button onClick={onContinue} data-testid="PluginUpdates__continue-button">
						<span>{t("COMMON.CONTINUE")}</span>
					</Button>
				</div>
			</div>
		</Modal>
	);
};
