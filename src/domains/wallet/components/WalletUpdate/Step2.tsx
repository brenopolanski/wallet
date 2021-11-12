import { CircularProgressBar } from "app/components/CircularProgressBar";
import { DownloadProgress } from "app/hooks";
import cn from "classnames";
import prettyBytes from "pretty-bytes";
import React from "react";
import { useTranslation } from "react-i18next";

export const SecondStep = ({ transferred = 0, total = 0, percent = 0 }: DownloadProgress) => {
	const { t } = useTranslation();

	return (
		<section data-testid="WalletUpdate__second-step">
			<div className="flex items-center mx-auto w-2/5">
				<div className="flex-1">
					<p className="text-sm font-semibold text-theme-secondary-400">
						{percent ? t("COMMON.DOWNLOADED") : t("COMMON.DOWNLOADING")}
					</p>

					{!!percent && (
						<p className="text-sm font-bold text-theme-secondary-text">
							{prettyBytes(total)} / {prettyBytes(transferred)}
						</p>
					)}
				</div>
				<div>
					<div className="flex justify-center">
						<div className={cn({ "animate-spin": !percent })}>
							<CircularProgressBar
								showValue={!!percent}
								value={percent ? Number.parseInt(percent.toFixed(0)) : 20}
								size={50}
								strokeWidth={5}
								fontSize={0.8}
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
