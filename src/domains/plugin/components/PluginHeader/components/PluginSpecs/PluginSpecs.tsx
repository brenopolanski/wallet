import { Link } from "app/components/Link";
import { Skeleton } from "app/components/Skeleton";
import cn from "classnames";
import { usePluginStatus } from "domains/plugin/hooks/use-plugin-status";
import { PluginCategories } from "domains/plugin/plugin.contracts";
import React from "react";
import { useTranslation } from "react-i18next";

interface Properties {
	author?: string;
	category?: PluginCategories;
	isEnabled?: boolean;
	isInstalled?: boolean;
	isLoadingSize?: boolean;
	logo?: string;
	size?: string;
	url?: string;
	version?: string;
}

interface GridColProperties {
	children: React.ReactNode;
	padding?: string;
}

interface GridItemProperties {
	children: React.ReactNode;
	label: string;
	className?: string;
}

const GridItem = ({ label, children, className }: GridItemProperties) => (
	<div className={cn("flex flex-col", className)}>
		<span className="text-sm font-semibold text-theme-secondary-500 dark:text-theme-secondary-700">{label}</span>
		<span className="font-semibold text-theme-secondary-text">{children}</span>
	</div>
);

const GridCol = ({ children, padding }: GridColProperties) => {
	const mountClassName = () => {
		let styles = "flex";

		if (padding) {
			styles = `${styles} ${padding}`;
		}

		return styles;
	};

	return <div className={mountClassName()}>{children}</div>;
};

export const PluginSpecs = ({
	author,
	category,
	url,
	version,
	size,
	isEnabled,
	isInstalled,
	isLoadingSize,
}: Properties) => {
	const { t } = useTranslation();

	const { renderPluginStatus } = usePluginStatus();

	return (
		<div className="flex justify-between space-4">
			<div className="flex space-x-6 divide-x divide-theme-secondary-300 dark:divide-theme-secondary-800">
				<GridCol>
					<GridItem label={t("COMMON.AUTHOR")}>
						<span className="font-semibold text-theme-secondary-text truncate max-w-48">{author}</span>
					</GridItem>
				</GridCol>

				<GridCol padding="pl-6">
					<GridItem label={t("COMMON.CATEGORY")}>
						{category && t(`PLUGINS.CATEGORIES.${category.toUpperCase()}`)}
					</GridItem>
				</GridCol>

				<GridCol padding="pl-6">
					<GridItem label={t("COMMON.WEBSITE")}>
						{url ? (
							<Link data-testid="PluginSpecs__website" to={url} isExternal>
								<span>{t("COMMON.VIEW")}</span>
							</Link>
						) : (
							<span>{t("COMMON.NOT_AVAILABLE")}</span>
						)}
					</GridItem>
				</GridCol>

				<GridCol padding="pl-6">
					<GridItem label={t("COMMON.STATUS")}>
						<span>{renderPluginStatus({ isEnabled, isInstalled })}</span>
					</GridItem>
				</GridCol>
			</div>

			<div className="flex space-x-6 divide-x divide-theme-secondary-300 dark:divide-theme-secondary-800">
				<GridCol padding="pl-6">
					<GridItem label={t("COMMON.SIZE")} className="text-right">
						{isLoadingSize ? (
							<span data-testid="PluginSpecs__size-skeleton">
								<Skeleton width={60} height={20} className="mt-0.5" />
							</span>
						) : (
							<span data-testid="PluginSpecs__size">{size || t("COMMON.NOT_AVAILABLE")}</span>
						)}
					</GridItem>
				</GridCol>

				<GridCol padding="pl-6">
					<GridItem label={t("COMMON.VERSION")} className="text-right">
						{version!}
					</GridItem>
				</GridCol>
			</div>
		</div>
	);
};
