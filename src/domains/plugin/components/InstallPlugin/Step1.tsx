import { PluginPermissions } from "domains/plugin/plugin.contracts";
import React from "react";
import { useTranslation } from "react-i18next";

interface Properties {
	plugin: any;
}

export const FirstStep = ({ plugin }: Properties) => {
	const { t, i18n } = useTranslation();
	const translatedPermissions = (plugin.permissions as PluginPermissions[]).map((permission) => {
		const key = `PLUGINS.PERMISSIONS.${permission}` as const;
		return i18n.exists(key) ? t(key) : permission;
	});

	return (
		<section data-testid="InstallPlugin__step--first">
			<p className="mt-7 text-lg font-semibold text-theme-secondary-text">
				{t("PLUGINS.MODAL_INSTALL_PLUGIN.DESCRIPTION")}
			</p>
			<div className="max-w-sm">
				<ul className="mt-2 ml-5 leading-8 list-outside list-disc text-theme-secondary-text">
					{translatedPermissions.map((permission: string) => (
						<li key={permission}>{permission}</li>
					))}
				</ul>
			</div>
		</section>
	);
};
