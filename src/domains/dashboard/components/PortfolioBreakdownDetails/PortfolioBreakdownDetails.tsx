import { DonutGraph } from "app/components/Graphs/DonutGraph";
import { DonutGraphDataPoint } from "app/components/Graphs/DonutGraph/DonutGraph.contracts";
import { Modal } from "app/components/Modal";
import { useTheme } from "app/hooks";
import { formatPercentage, getColor } from "domains/dashboard/components/PortfolioBreakdown/PortfolioBreakdown.helpers";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { AssetList, Tooltip } from "./PortfolioBreakdownDetails.blocks";
import { PortfolioBreakdownDetailsProperties } from "./PortfolioBreakdownDetails.contracts";

export const PortfolioBreakdownDetails: React.VFC<PortfolioBreakdownDetailsProperties> = ({
	isOpen,
	assets,
	exchangeCurrency,
	onClose,
}) => {
	const { t } = useTranslation();
	const { isDarkMode } = useTheme();

	const donutGraphData = useMemo<DonutGraphDataPoint[]>(
		() =>
			assets.map((asset, index) => ({
				color: getColor(index, isDarkMode),
				data: {
					label: asset.label,
					percentFormatted: formatPercentage(asset.percent),
				},
				value: asset.percent,
			})),
		[assets, isDarkMode],
	);

	return (
		<Modal isOpen={isOpen} title={t("DASHBOARD.PORTFOLIO_BREAKDOWN_DETAILS.TITLE")} onClose={onClose}>
			<div className="space-y-4">
				<div className="flex justify-center">
					<DonutGraph
						data={[
							{
								color: "success-600",
								data: {
									amountFormatted: "50 USD",
									label: "ARK",
									percentFormatted: "50%",
								},
								value: 50,
							},
							{
								color: "warning-600",
								data: {
									amountFormatted: "30 USD",
									label: "BTC",
									percentFormatted: "30%",
								},
								value: 30,
							},
							{
								color: "info-600",
								data: {
									amountFormatted: "20 USD",
									label: "ETH",
									percentFormatted: "20%",
								},
								value: 20,
							},
						]}
						size={280}
						renderTooltip={(dataPoint) => <Tooltip dataPoint={dataPoint} />}
						renderContentInsideCircle={() => <text>Hello people</text>}
					/>
				</div>

				<AssetList assets={assets} exchangeCurrency={exchangeCurrency} />
			</div>
		</Modal>
	);
};
