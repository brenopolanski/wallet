import { sortByDesc } from "@arkecosystem/utils";
import { Contracts, Helpers } from "@payvo/profiles";
import { Amount } from "app/components/Amount";
import { EmptyBlock } from "app/components/EmptyBlock";
import { GRAPH_COLOR_EMPTY } from "app/components/Graphs/Graphs.shared";
import { LineGraph } from "app/components/Graphs/LineGraph";
import { LineGraphDataPoint } from "app/components/Graphs/LineGraph/LineGraph.contracts";
import { PortfolioBreakdownDetails } from "domains/dashboard/components/PortfolioBreakdownDetails";
import { usePortfolioBreakdown } from "domains/dashboard/hooks/use-portfolio-breakdown";
import React, { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { LabelledText, Legend, PortfolioBreakdownSkeleton, Tooltip } from "./PortfolioBreakdown.blocks";
import { formatPercentage, getColor } from "./PortfolioBreakdown.helpers";

interface PortfolioBreakdownProperties {
	profile: Contracts.IProfile;
	profileIsSyncingExchangeRates: boolean;
}

export const PortfolioBreakdown: React.VFC<PortfolioBreakdownProperties> = ({
	profile,
	profileIsSyncingExchangeRates,
}) => {
	const { t } = useTranslation();

	const [isDetailsOpen, setIsDetailsOpen] = useState(false);

	const { loading, balance, assets, walletsCount, ticker } = usePortfolioBreakdown({
		profile,
		profileIsSyncingExchangeRates,
	});

	const hasZeroBalance = useMemo(() => balance === 0, [balance]);

	const lineGraphData = useMemo<LineGraphDataPoint[]>(() => {
		if (hasZeroBalance) {
			return assets.map((asset) => ({
				color: GRAPH_COLOR_EMPTY,
				data: {
					amountFormatted: Helpers.Currency.format(0, ticker),
					label: asset.label,
					percentFormatted: `0%`,
				},
				value: 0,
			}));
		}

		return sortByDesc(assets, "percent").map((asset, index) => ({
			color: getColor(index),
			data: {
				amountFormatted: Helpers.Currency.format(asset.convertedAmount, ticker),
				label: asset.label,
				percentFormatted: formatPercentage(asset.percent),
			},
			value: asset.percent,
		}));
	}, [assets, hasZeroBalance, ticker]);

	if (loading && assets.length === 0) {
		return <PortfolioBreakdownSkeleton />;
	}

	if (assets.length === 0) {
		return (
			<EmptyBlock>
				<Trans i18nKey="DASHBOARD.PORTFOLIO_BREAKDOWN.EMPTY" components={{ bold: <strong /> }} />
			</EmptyBlock>
		);
	}

	return (
		<>
			<div className="py-4 px-6 bg-theme-secondary-100 rounded-xl flex">
				<div className="flex space-x-3 divide-x divide-theme-secondary-300 dark:divide-theme-secondary-800">
					<LabelledText label={t("COMMON.YOUR_BALANCE")}>
						{(textClassName) => <Amount className={textClassName} ticker={ticker} value={balance} />}
					</LabelledText>

					<LabelledText label={t("COMMON.ASSETS")}>
						{(textClassName) => <span className={textClassName}>{assets.length}</span>}
					</LabelledText>

					<LabelledText label={t("COMMON.WALLETS")}>
						{(textClassName) => <span className={textClassName}>{walletsCount}</span>}
					</LabelledText>
				</div>

				<div className="flex-1 ml-6">
					<LineGraph
						data={lineGraphData}
						renderAsEmpty={hasZeroBalance}
						renderTooltip={(dataPoint) => <Tooltip dataPoint={dataPoint} />}
						renderLegend={(dataPoints) => (
							<Legend
								dataPoints={dataPoints}
								hasZeroBalance={hasZeroBalance}
								onMoreDetailsClick={() => setIsDetailsOpen(true)}
							/>
						)}
					/>
				</div>
			</div>

			<PortfolioBreakdownDetails
				isOpen={isDetailsOpen}
				assets={assets}
				exchangeCurrency={ticker}
				onClose={() => setIsDetailsOpen(false)}
			/>
		</>
	);
};
