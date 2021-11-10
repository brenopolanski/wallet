import { Slider } from "app/components/Slider";
import { TruncateEnd } from "app/components/TruncateEnd";
import { PluginPermissionsModal } from "domains/plugin/components/PluginPermissionsModal/PluginPermissionsModal";
import { PluginPermissions } from "domains/plugin/plugin.contracts";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const Description = ({ description }: { description?: string }) => {
	const { t } = useTranslation();

	if (!description) {
		return <></>;
	}

	return (
		<div data-testid="PluginInfo__description">
			<h4 className="font-bold">{t("PLUGINS.PLUGIN_INFO.ABOUT")}</h4>
			<p className="mt-3 text-theme-secondary-600">{description}</p>
		</div>
	);
};

const Permissions = ({ permissions }: { permissions: PluginPermissions[] }) => {
	const { t, i18n } = useTranslation();

	const [showPermissionsModal, setShowPermissionsModal] = useState(false);

	if (!permissions.length) {
		return <></>;
	}

	const translatedPermissions = permissions.map((permission) => {
		const key = `PLUGINS.PERMISSIONS.${permission}` as const;
		return i18n.exists(key) ? t(key) : permission;
	});

	const permissionsString = translatedPermissions.join(", ");

	return (
		<>
			<div data-testid="PluginInfo__permissions">
				<h4 className="font-bold">{t("COMMON.PERMISSIONS")}</h4>
				<div className="inline-flex items-baseline space-x-2">
					<p className="mt-3 text-theme-secondary-600">
						<TruncateEnd maxChars={50} showTooltip={false} text={permissionsString} />
					</p>

					{permissionsString.length > 50 && (
						<button onClick={() => setShowPermissionsModal(true)} className="font-semibold link">
							{t("COMMON.VIEW_ALL")}
						</button>
					)}
				</div>
			</div>

			<PluginPermissionsModal
				permissions={translatedPermissions}
				isOpen={showPermissionsModal}
				onClose={() => setShowPermissionsModal(false)}
			/>
		</>
	);
};

const Requirements = ({ minimumVersion }: { minimumVersion?: string }) => {
	const { t } = useTranslation();

	if (!minimumVersion) {
		return <></>;
	}

	return (
		<div data-testid="PluginInfo__requirements">
			<h4 className="font-bold">{t("PLUGINS.PLUGIN_INFO.REQUIREMENTS")}</h4>
			<p className="mt-3 text-theme-secondary-600">
				<span>{t("PLUGINS.PLUGIN_INFO.WALLET_VERSION", { minimumVersion })}</span>
			</p>
		</div>
	);
};

const Images = ({ images }: { images: string[] }) => {
	const { t } = useTranslation();

	if (!images.length) {
		return <></>;
	}

	return (
		<div data-testid="PluginInfo__images">
			<p className="font-bold">{t("PLUGINS.PLUGIN_INFO.SCREENSHOTS")}</p>
			<div
				className="flex absolute top-0 right-0 pr-4 space-x-3 screenshots-pagination"
				data-testid="PluginInfo__images--pagination"
			/>
			<div className="mt-4">
				<Slider
					data={images}
					options={{
						pagination: {
							clickable: true,
							el: ".screenshots-pagination",
						},
						slideHeight: 200,
						slidesPerColumn: 1,
						slidesPerGroup: 3,
						slidesPerView: 3,
						spaceBetween: 18,
					}}
				>
					{(screenshot: any) => (
						<img
							src={screenshot}
							data-testid="PluginInfo__images--screenshot"
							className="object-contain overflow-hidden w-full max-h-44 rounded-lg bg-theme-secondary-200"
							alt="Screenshot"
						/>
					)}
				</Slider>
			</div>
		</div>
	);
};

export { Description, Images, Permissions, Requirements };
