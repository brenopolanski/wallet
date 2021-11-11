import { prettyBytes } from "@arkecosystem/utils";
import { CircularProgressBar } from "app/components/CircularProgressBar";
import { PluginImage } from "domains/plugin/components/PluginImage";
import React from "react";
import { useTranslation } from "react-i18next";

interface Properties {
	plugin: any;
	downloadProgress: { percent?: number; transferredBytes?: number; totalBytes: number };
}

export const SecondStep = ({ plugin, downloadProgress }: Properties) => {
	const { t } = useTranslation();

	const hasSize = plugin.size && plugin.size !== "0 B";

	const percent = Math.floor((downloadProgress.percent || 0) * 100);

	return (
		<section data-testid="InstallPlugin__step--second">
			<div className="flex mt-8">
				<PluginImage className="mr-6" size="lg" logoURL={plugin.logo} />

				<div className="flex-1">
					<div className="flex flex-col justify-around h-full">
						<div>
							<p className="text-sm font-semibold text-theme-secondary-400">{t("COMMON.PLUGIN")}</p>
							<p className="text-lg font-semibold text-theme-black">{plugin.title}</p>
						</div>
						<div className="flex justify-between">
							<span>
								<p className="text-sm font-semibold text-theme-secondary-400">
									{t("COMMON.DOWNLOADING")}...
								</p>
								<p
									data-testid="InstallPlugin__step--second__progress"
									className="font-bold text-theme-secondary-text"
								>
									{prettyBytes(downloadProgress.transferredBytes ?? 0)} /{" "}
									{hasSize ? plugin.size : prettyBytes(downloadProgress.totalBytes)}
								</p>
							</span>
							<div className="mr-2">
								<CircularProgressBar value={percent} size={50} strokeWidth={3} fontSize={0.8} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
