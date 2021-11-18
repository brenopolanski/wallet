import { Page, Section } from "app/components/Layout";
import { useActiveProfile, useQueryParams } from "app/hooks";
import { toasts } from "app/services";
import { InstallPlugin } from "domains/plugin/components/InstallPlugin";
import { PluginHeader } from "domains/plugin/components/PluginHeader";
import { PluginInfo } from "domains/plugin/components/PluginInfo";
import { PluginUninstallConfirmation } from "domains/plugin/components/PluginUninstallConfirmation/PluginUninstallConfirmation";
import { usePluginManagerContext } from "plugins/context/PluginManagerProvider";
import prettyBytes from "pretty-bytes";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";

export const PluginDetails = () => {
	const { t } = useTranslation();
	const activeProfile = useActiveProfile();
	const queryParameters = useQueryParams();
	const history = useHistory();

	const [isUninstallOpen, setIsUninstallOpen] = React.useState(false);
	const [isInstallOpen, setIsInstallOpen] = React.useState(false);
	const [size, setSize] = useState<string>();
	const [isLoadingSize, setIsLoadingSize] = useState(false);

	const {
		allPlugins,
		pluginConfigurations,
		pluginManager,
		reportPlugin,
		trigger,
		mapConfigToPluginData,
		updatePlugin,
		updatingStats,
		fetchSize,
	} = usePluginManagerContext();

	const pluginId = queryParameters.get("pluginId");
	const repositoryURL = queryParameters.get("repositoryURL");

	const pluginCtrl = pluginManager.plugins().findById(pluginId!);
	const isEnabled = !!pluginCtrl?.isEnabled(activeProfile);
	const isInstalled = !!pluginCtrl;
	const hasLaunch = !!pluginCtrl?.hooks().hasCommand("service:launch.render");

	const latestConfiguration = useMemo(
		() => pluginConfigurations.find((item) => item.id() === pluginId),
		[pluginConfigurations, pluginId],
	);
	const packageConfiguration = useMemo(
		() => allPlugins.find((item) => item.id() === pluginId),
		[allPlugins, pluginId],
	);

	const plugin = useMemo(() => {
		// Installed plugins should display the configuration
		// of the downloaded version and the latest one only if the user updates it.
		if (isInstalled) {
			return packageConfiguration;
		}
		return latestConfiguration || packageConfiguration;
	}, [isInstalled, packageConfiguration, latestConfiguration]);

	const pluginData = useMemo(
		() => (plugin && mapConfigToPluginData(activeProfile, plugin)) || ({} as any),
		[activeProfile, mapConfigToPluginData, plugin],
	);

	const handleReportPlugin = () => {
		reportPlugin(plugin!);
	};

	const handleLaunch = () => {
		history.push(`/profiles/${activeProfile.id()}/plugins/view?pluginId=${pluginId}`);
	};

	const handleOnDelete = () => {
		history.push(`/profiles/${activeProfile.id()}/plugins`);
	};

	const closeInstallModal = () => {
		setIsInstallOpen(false);
	};

	const checkSizeRemote = async () => {
		setIsLoadingSize(true);
		const pluginSize = await fetchSize(pluginData.id);
		if (pluginSize) {
			setSize(prettyBytes(pluginSize));
		}
		setIsLoadingSize(false);
	};

	const handleEnable = () => {
		try {
			pluginCtrl?.enable(activeProfile, { autoRun: true });
			trigger();
			toasts.success(t("PLUGINS.ENABLE_SUCCESS", { name: pluginData.title }));
		} catch (error) {
			toasts.error(t("PLUGINS.ENABLE_FAILURE", { msg: error.message, name: pluginData.title }));
		}
	};

	const handleDisable = () => {
		pluginCtrl?.disable(activeProfile);
		trigger();
		toasts.success(t("PLUGINS.DISABLE_SUCCESS", { name: pluginData.title }));
	};

	useEffect(() => {
		if (isInstalled) {
			setSize(pluginData.size);
			return;
		}

		checkSizeRemote();
	}, [isInstalled, pluginData]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<Page>
			<Section border>
				<PluginHeader
					{...pluginData}
					isLoadingSize={isLoadingSize}
					size={size}
					isEnabled={isEnabled}
					isInstalled={isInstalled}
					onDelete={() => setIsUninstallOpen(true)}
					onReport={handleReportPlugin}
					onInstall={() => setIsInstallOpen(true)}
					onEnable={handleEnable}
					onDisable={handleDisable}
					onUpdate={() => updatePlugin(pluginData, activeProfile.id())}
					updateStatus={pluginData.updateStatus || {}}
					updatingStats={updatingStats?.[pluginData.name]}
					hasLaunch={hasLaunch}
					onLaunch={handleLaunch}
				/>
			</Section>

			<Section>
				<PluginInfo {...pluginData} />
			</Section>

			{plugin && (
				<InstallPlugin
					profile={activeProfile}
					plugin={plugin.toObject()}
					repositoryURL={repositoryURL!}
					isOpen={isInstallOpen}
					onClose={closeInstallModal}
					onCancel={closeInstallModal}
				/>
			)}

			{pluginCtrl && (
				<PluginUninstallConfirmation
					isOpen={isUninstallOpen}
					plugin={pluginCtrl}
					profile={activeProfile}
					onClose={() => setIsUninstallOpen(false)}
					onDelete={handleOnDelete}
				/>
			)}
		</Page>
	);
};
