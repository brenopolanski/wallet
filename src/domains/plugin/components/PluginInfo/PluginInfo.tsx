import { Alert } from "app/components/Alert";
import { PluginPermissions } from "domains/plugin/plugin.contracts";
import React from "react";
import { useTranslation } from "react-i18next";

import { Description, Images, Permissions, Requirements } from "./PluginInfo.blocks";

interface PluginInfoProperties {
	description?: string;
	images: string[];
	minimumVersion?: string;
	permissions: PluginPermissions[];
}

const defaultProps = {
	images: [],
	permissions: [],
};

export const PluginInfo = ({
	description,
	images = defaultProps.images,
	minimumVersion,
	permissions = defaultProps.permissions,
}: PluginInfoProperties) => {
	const { t } = useTranslation();

	return (
		<div className="space-y-8">
			<Description description={description} />
			<Permissions permissions={permissions} />
			<Requirements minimumVersion={minimumVersion} />
			<Images images={images} />

			<Alert variant="warning" title={t("COMMON.DISCLAIMER")}>
				{t("PLUGINS.PLUGIN_INFO.DISCLAIMER")}
			</Alert>
		</div>
	);
};
