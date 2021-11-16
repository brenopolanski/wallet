import { Contracts } from "@payvo/profiles";
import { Amount } from "app/components/Amount";
import { EmptyBlock } from "app/components/EmptyBlock";
import { LineGraph } from "app/components/Graphs/LineGraph";
import { LineGraphMapper } from "app/components/Graphs/LineGraph/LineGraph.contracts";
import { PortfolioBreakdownDetails } from "domains/dashboard/components/PortfolioBreakdownDetails";
import { usePortfolioBreakdown } from "domains/dashboard/hooks/use-portfolio-breakdown";
import React, { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { LabelledText, Legend, PortfolioBreakdownSkeleton, Tooltip } from "./PortfolioBreakdown.blocks";
import { AssetItem } from "./PortfolioBreakdown.contracts";
import { getAssetsToDataPointsMapper } from "./PortfolioBreakdown.helpers";

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

	const mapper = useMemo<LineGraphMapper<AssetItem>>(() => getAssetsToDataPointsMapper(ticker, hasZeroBalance), [
		ticker,
		hasZeroBalance,
	]);

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

	// @TODO improve dark mode styles

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
						items={assets}
						mapper={mapper}
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
				data={assets}
				exchangeCurrency={ticker}
				onClose={() => setIsDetailsOpen(false)}
			/>
		</>
	);
};
