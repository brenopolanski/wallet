import { snakeCase } from "@arkecosystem/utils";
import { Button } from "app/components/Button";
import { EmptyBlock } from "app/components/EmptyBlock";
import { Header } from "app/components/Header";
import { HeaderSearchBar } from "app/components/Header/HeaderSearchBar";
import { Icon } from "app/components/Icon";
import { Page, Section } from "app/components/Layout";
import { useEnvironmentContext } from "app/contexts";
import { useActiveProfile } from "app/hooks";
import { toasts } from "app/services";
import { InstallPlugin } from "domains/plugin/components/InstallPlugin";
import { ManualInstallationDisclaimer } from "domains/plugin/components/ManualInstallationDisclaimer";
import { PluginGrid } from "domains/plugin/components/PluginGrid";
import { PluginList } from "domains/plugin/components/PluginList";
import {
	PluginManagerNavigationBar,
	PluginManagerNavigationBarItem,
} from "domains/plugin/components/PluginManagerNavigationBar";
import { PluginManualInstallModal } from "domains/plugin/components/PluginManualInstallModal/PluginManualInstallModal";
import { PluginUninstallConfirmation } from "domains/plugin/components/PluginUninstallConfirmation/PluginUninstallConfirmation";
import { PluginUpdatesConfirmation } from "domains/plugin/components/PluginUpdatesConfirmation";
import { usePluginUpdateQueue } from "domains/plugin/hooks/use-plugin-update-queue";
import { PLUGIN_CATEGORIES } from "domains/plugin/plugin.constants";
import { PluginCategories } from "domains/plugin/plugin.contracts";
import { usePluginManagerContext } from "plugins/context/PluginManagerProvider";
import { IPluginController } from "plugins/core";
import { SerializedPluginConfigurationData } from "plugins/types";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { assertPluginController } from "utils/assertions";

interface LatestPluginsProperties {
	isLoading?: boolean;
	onCurrentViewChange: (view: string) => void;
	onDelete: any;
	onDisable: (plugin: any) => void;
	onEnable: (plugin: any) => void;
	onInstall: any;
	onLaunch: (plugin: any) => void;
	onSelect: (pluginId: string) => void;
	onUpdate: (plugin: any) => void;
	pluginsByCategory: Record<string, any[]>;
	updatingStats?: any;
	viewType: string;
	isCompact?: boolean;
}

const LatestPlugins = ({
	isLoading,
	onCurrentViewChange,
	onDelete,
	onDisable,
	onEnable,
	onInstall,
	onLaunch,
	onSelect,
	onUpdate,
	pluginsByCategory,
	updatingStats,
	viewType,
	isCompact,
}: LatestPluginsProperties) => {
	const { t } = useTranslation();

	const renderPlugins = (plugins: any[], category: PluginCategories) => {
		if (viewType === "grid") {
			return (
				<PluginGrid
					category={category}
					isLoading={isLoading}
					onDelete={onDelete}
					onDisable={onDisable}
					onEnable={onEnable}
					onInstall={onInstall}
					onLaunch={onLaunch}
					onSelect={onSelect}
					onUpdate={onUpdate}
					plugins={plugins}
					showPagination={false}
					updatingStats={updatingStats}
				/>
			);
		}

		return (
			<PluginList
				onClick={onSelect}
				onDelete={onDelete}
				onDisable={onDisable}
				onEnable={onEnable}
				onInstall={onInstall}
				onLaunch={onLaunch}
				onUpdate={onUpdate}
				plugins={plugins}
				showPagination={false}
				updatingStats={updatingStats}
				isCompact={isCompact}
			/>
		);
	};

	return (
		<>
			{PLUGIN_CATEGORIES.map((category) => {
				let plugins: any[] = pluginsByCategory[category] ?? [];
				const categoryCount = plugins.length;

				plugins = plugins.slice(0, 3);

				if (plugins.length < 3 && viewType === "grid") {
					plugins.push(...new Array(3 - plugins.length).fill(undefined));
				}

				return (
					<Section key={category}>
						<div data-testid={`PluginManager__latest__${category}`}>
							<div className="flex justify-between items-center mb-6">
								<h2 className="mb-0 font-bold">{t(`PLUGINS.CATEGORIES.${category.toUpperCase()}`)}</h2>

								{categoryCount > plugins.length && !plugins.some((plugin) => !plugin) && (
									<span
										className="flex items-center space-x-2 font-semibold link"
										data-testid={`PluginManager__latest__${category}__view-all`}
										onClick={() => onCurrentViewChange(category)}
									>
										<span>{t("COMMON.VIEW_ALL")}</span>
										<Icon name="ChevronRight" size="sm" />
									</span>
								)}
							</div>

							{renderPlugins(plugins, category)}
						</div>
					</Section>
				);
			})}
		</>
	);
};

const UpdateAllBanner = ({
	hasUpdateAvailableCount,
	hasCompatibleUpdateAvailableCount,
	isUpdatingAll,
	onUpdateAll,
}: {
	hasUpdateAvailableCount: number;
	hasCompatibleUpdateAvailableCount: number;
	isUpdatingAll: boolean;
	onUpdateAll: () => void;
}) => {
	const { t } = useTranslation();

	if (hasUpdateAvailableCount === 0) {
		return null;
	}

	const renderText = () => {
		if (!hasCompatibleUpdateAvailableCount) {
			// TODO: waiting for i18next.TS will support plurals https://github.com/i18next/i18next/issues/1683
			return (
				<span>{t("PLUGINS.UPDATE_ALL_NOTICE_INCOMPATIBLE" as any, { count: hasUpdateAvailableCount })}</span>
			);
		}

		// TODO: waiting for i18next.TS will support plurals https://github.com/i18next/i18next/issues/1683
		return <span>{t("PLUGINS.UPDATE_ALL_NOTICE" as any, { count: hasUpdateAvailableCount })}</span>;
	};

	return (
		<EmptyBlock size="sm" className="mb-6">
			<div className="flex justify-between items-center w-full">
				{renderText()}

				<Button
					disabled={!hasCompatibleUpdateAvailableCount || isUpdatingAll}
					className="-mr-1"
					data-testid="PluginManager__update-all"
					onClick={onUpdateAll}
				>
					{isUpdatingAll ? t("COMMON.UPDATING") : t("PLUGINS.UPDATE_ALL")}
				</Button>
			</div>
		</EmptyBlock>
	);
};

export const PluginManager = () => {
	const { t } = useTranslation();
	const {
		allPlugins,
		isFetchingPackages,
		trigger,
		updatingStats,
		filters,
		filterBy,
		fetchPluginPackages,
		hasFilters,
		searchResults,
		resetFilters,
	} = usePluginManagerContext();

	const activeProfile = useActiveProfile();
	const history = useHistory();
	const { pluginManager, mapConfigToPluginData, updatePlugin } = usePluginManagerContext();
	const { persist } = useEnvironmentContext();
	const { startUpdate, isUpdating: isUpdatingAll } = usePluginUpdateQueue(activeProfile);

	const [currentViewValue, setCurrentViewValue] = useState("latest");
	const [viewType, setViewType] = useState("grid");

	const currentView = useMemo(() => {
		if (hasFilters) {
			return "search";
		}
		return currentViewValue;
	}, [currentViewValue, hasFilters]);

	const [isOpenDisclaimer, setIsOpenDisclaimer] = useState(false);

	const [updatesConfirmationPlugins, setUpdatesConfirmationPlugins] = useState<any[]>([]);
	const [isManualInstallModalOpen, setIsManualInstallModalOpen] = useState(false);
	const [uninstallSelectedPlugin, setUninstallSelectedPlugin] = useState<IPluginController | undefined>(undefined);
	const [installSelectedPlugin, setInstallSelectedPlugin] = useState<IPluginController | undefined>(undefined);

	const plugins = allPlugins.map(mapConfigToPluginData.bind(null, activeProfile));
	const searchResultsData = searchResults.map(mapConfigToPluginData.bind(null, activeProfile));

	const useCompactTables = !activeProfile.appearance().get("useExpandedTables");

	const { hasUpdateAvailableCount, hasCompatibleUpdateAvailableCount } = plugins.reduce(
		(counts, item) => {
			if (item.updateStatus.isAvailable) {
				counts.hasUpdateAvailableCount++;
			}

			if (item.updateStatus.isCompatible) {
				counts.hasCompatibleUpdateAvailableCount++;
			}

			return counts;
		},
		{
			hasCompatibleUpdateAvailableCount: 0,
			hasUpdateAvailableCount: 0,
		},
	);

	const pluginsByCategory = useMemo(() => {
		const result: Record<string, any[]> = {};

		for (const plugin of plugins) {
			/* istanbul ignore else */
			if (!result[plugin.category]) {
				result[plugin.category] = [];
			}

			result[plugin.category].push(plugin);
		}

		return result;
	}, [plugins]);

	useEffect(() => {
		fetchPluginPackages();
	}, [fetchPluginPackages]);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const filteredPackages = useMemo(() => pluginsByCategory[currentView] || [], [
		currentView,
		filters,
		pluginsByCategory,
	]);

	const installedPlugins = pluginManager
		.plugins()
		.all()
		.map((item) => item.config())
		.map(mapConfigToPluginData.bind(null, activeProfile));

	const setCurrentView = (value: string) => {
		resetFilters();
		setCurrentViewValue(value);
	};

	const handleSelectPlugin = (pluginData: any) =>
		history.push(`/profiles/${activeProfile.id()}/plugins/details?pluginId=${pluginData.id}`);

	const handleEnablePlugin = async (pluginData: any) => {
		const pluginController = pluginManager.plugins().findById(pluginData.id);

		assertPluginController(pluginController);

		try {
			pluginController.enable(activeProfile, { autoRun: true });
			await persist();
			toasts.success(t("PLUGINS.ENABLE_SUCCESS", { name: pluginData.title }));
		} catch (error) {
			toasts.error(t("PLUGINS.ENABLE_FAILURE", { msg: error.message, name: pluginData.title }));
		}
	};

	const handleDisablePlugin = async (pluginData: SerializedPluginConfigurationData) => {
		const pluginController = pluginManager.plugins().findById(pluginData.id);

		assertPluginController(pluginController);

		pluginController.disable(activeProfile);
		await persist();
	};

	const handleDeletePlugin = (pluginData: SerializedPluginConfigurationData) => {
		setUninstallSelectedPlugin(pluginManager.plugins().findById(pluginData.id));
	};

	const handleLaunchPlugin = (pluginData: SerializedPluginConfigurationData) => {
		history.push(`/profiles/${activeProfile.id()}/plugins/view?pluginId=${pluginData.id}`);
	};

	const handleManualInstall = ({ pluginId, repositoryURL }: { pluginId: string; repositoryURL: string }) => {
		setIsManualInstallModalOpen(false);
		history.push(
			`/profiles/${activeProfile.id()}/plugins/details?pluginId=${pluginId}&repositoryURL=${repositoryURL}`,
		);
	};

	const handleUpdate = (pluginData: SerializedPluginConfigurationData) => {
		updatePlugin(pluginData, activeProfile.id());
	};

	const openInstallPluginModal = (pluginData: IPluginController) => {
		setInstallSelectedPlugin(pluginData);
	};

	const openManualInstallPluginModal = () => {
		const shouldShowDisclaimer = !activeProfile.hasAcceptedManualInstallationDisclaimer();

		if (shouldShowDisclaimer) {
			setIsOpenDisclaimer(true);
		} else {
			setIsManualInstallModalOpen(true);
		}
	};

	const handleDisclaimer = (isAccepted: boolean, rememberChoice?: boolean) => {
		setIsOpenDisclaimer(false);

		if (isAccepted) {
			setIsManualInstallModalOpen(true);

			if (rememberChoice) {
				activeProfile.markManualInstallationDisclaimerAsAccepted();
			}
		}
	};

	const onDeletePlugin = () => {
		setUninstallSelectedPlugin(undefined);
		trigger();
	};

	const viewPlugins = useMemo(() => {
		switch (currentView) {
			case "my-plugins":
				return installedPlugins;
			case "all":
				return plugins;
			case "search":
				return searchResultsData;
			default:
				return filteredPackages;
		}
	}, [currentView, installedPlugins, plugins, filteredPackages, searchResultsData]);

	const handleUpdateAll = () => {
		const pluginsWithAvailableUpdate = plugins.filter((item) => item.updateStatus.isAvailable);
		setUpdatesConfirmationPlugins(pluginsWithAvailableUpdate);
	};

	const handleUpdateConfirmation = () => {
		const pluginsWithCompatibleUpdate = updatesConfirmationPlugins.filter((item) => item.updateStatus.isCompatible);

		setUpdatesConfirmationPlugins([]);

		startUpdate(pluginsWithCompatibleUpdate);
	};

	const menu = (["latest", "all", ...PLUGIN_CATEGORIES] as const).map((name) => {
		const menuItem: PluginManagerNavigationBarItem = {
			name,
			title: t(`PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.${name.toUpperCase()}`),
		};

		if (name !== "latest" && name !== "all") {
			menuItem.count = allPlugins.filter((package_) => package_.hasCategory(name)).length;
		}

		return menuItem;
	});

	return (
		<>
			<Page isBackDisabled={true}>
				<Section>
					<Header
						title={t("PLUGINS.PAGE_PLUGIN_MANAGER.TITLE")}
						subtitle={t("PLUGINS.PAGE_PLUGIN_MANAGER.DESCRIPTION")}
						extra={
							<div className="flex justify-end items-top text-theme-primary-200">
								<HeaderSearchBar
									defaultQuery={filters.query}
									label={t("COMMON.SEARCH")}
									onSearch={(query) => {
										filterBy({ query });
									}}
									resetFields={filters.query === ""}
								/>

								<div className="pl-8 my-auto ml-5 h-10 border-l border-theme-secondary-300 dark:border-theme-secondary-800" />

								<Button
									data-testid="PluginManager_header--install"
									onClick={openManualInstallPluginModal}
								>
									<div className="flex items-center space-x-2 whitespace-nowrap">
										<Icon name="File" />
										<span>{t("PLUGINS.MODAL_MANUAL_INSTALL_PLUGIN.TITLE")}</span>
									</div>
								</Button>
							</div>
						}
					/>
				</Section>

				<PluginManagerNavigationBar
					hasUpdatesAvailable={hasUpdateAvailableCount > 0}
					installedPluginsCount={installedPlugins.length}
					menu={menu}
					selectedView={currentView}
					selectedViewType={viewType}
					onChange={setCurrentView}
					onSelectGridView={() => setViewType("grid")}
					onSelectListView={() => setViewType("list")}
				/>

				{currentView === "latest" && (
					<LatestPlugins
						isLoading={isFetchingPackages}
						updatingStats={updatingStats}
						viewType={viewType}
						pluginsByCategory={pluginsByCategory}
						onCurrentViewChange={setCurrentView}
						onInstall={openInstallPluginModal}
						onEnable={handleEnablePlugin}
						onDisable={handleDisablePlugin}
						onDelete={handleDeletePlugin}
						onSelect={handleSelectPlugin}
						onLaunch={handleLaunchPlugin}
						onUpdate={handleUpdate}
						isCompact={useCompactTables}
					/>
				)}

				<Section>
					{currentView !== "latest" && (
						<>
							<h2 className="mb-6 font-bold">
								{t(`PLUGINS.PAGE_PLUGIN_MANAGER.VIEW.${snakeCase(currentView)?.toUpperCase()}` as any)}
							</h2>

							{currentView === "my-plugins" && (
								<UpdateAllBanner
									hasUpdateAvailableCount={hasUpdateAvailableCount}
									hasCompatibleUpdateAvailableCount={hasCompatibleUpdateAvailableCount}
									isUpdatingAll={isUpdatingAll}
									onUpdateAll={handleUpdateAll}
								/>
							)}

							<div data-testid={`PluginManager__container--${currentView}`}>
								{viewType === "grid" && (
									<PluginGrid
										plugins={viewPlugins}
										updatingStats={updatingStats}
										emptyMessage={
											currentView === "my-plugins"
												? t("PLUGINS.PAGE_PLUGIN_MANAGER.NO_PLUGINS_INSTALLED")
												: currentView === "search"
												? t("PLUGINS.PAGE_PLUGIN_MANAGER.NO_PLUGINS_FOUND", {
														query: filters.query,
												  })
												: undefined
										}
										isLoading={isFetchingPackages}
										onDelete={handleDeletePlugin}
										onDisable={handleDisablePlugin}
										onEnable={handleEnablePlugin}
										onInstall={openInstallPluginModal}
										onLaunch={handleLaunchPlugin}
										onSelect={handleSelectPlugin}
										onUpdate={handleUpdate}
									/>
								)}

								{viewType === "list" && (
									<PluginList
										emptyMessage={
											currentView === "my-plugins"
												? t("PLUGINS.PAGE_PLUGIN_MANAGER.NO_PLUGINS_INSTALLED")
												: currentView === "search"
												? t("PLUGINS.PAGE_PLUGIN_MANAGER.NO_PLUGINS_FOUND", {
														query: filters.query,
												  })
												: undefined
										}
										onUpdate={handleUpdate}
										plugins={viewPlugins}
										showCategory={["my-plugins", "search", "all"].includes(currentView)}
										updatingStats={updatingStats}
										onClick={handleSelectPlugin}
										onDelete={handleDeletePlugin}
										onDisable={handleDisablePlugin}
										onEnable={handleEnablePlugin}
										onInstall={openInstallPluginModal}
										onLaunch={handleLaunchPlugin}
										isCompact={useCompactTables}
									/>
								)}
							</div>
						</>
					)}
				</Section>
			</Page>

			<ManualInstallationDisclaimer
				isOpen={isOpenDisclaimer}
				onClose={() => handleDisclaimer(false)}
				onDecline={() => handleDisclaimer(false)}
				onAccept={(rememberChoice) => handleDisclaimer(true, rememberChoice)}
			/>

			{installSelectedPlugin && (
				<InstallPlugin
					profile={activeProfile}
					plugin={installSelectedPlugin}
					isOpen={true}
					onClose={() => setInstallSelectedPlugin(undefined)}
					onCancel={() => setInstallSelectedPlugin(undefined)}
				/>
			)}

			<PluginManualInstallModal
				isOpen={isManualInstallModalOpen}
				onClose={() => setIsManualInstallModalOpen(false)}
				onSuccess={handleManualInstall}
			/>

			<PluginUpdatesConfirmation
				isOpen={updatesConfirmationPlugins.length > 0}
				plugins={updatesConfirmationPlugins}
				onClose={() => setUpdatesConfirmationPlugins([])}
				onContinue={handleUpdateConfirmation}
			/>

			{uninstallSelectedPlugin && (
				<PluginUninstallConfirmation
					isOpen={true}
					plugin={uninstallSelectedPlugin}
					profile={activeProfile}
					onClose={() => setUninstallSelectedPlugin(undefined)}
					onDelete={onDeletePlugin}
				/>
			)}
		</>
	);
};
