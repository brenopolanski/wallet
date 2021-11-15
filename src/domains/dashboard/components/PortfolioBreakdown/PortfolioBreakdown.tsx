import { Contracts } from "@payvo/profiles";
import { Amount } from "app/components/Amount";
import { Divider } from "app/components/Divider";
import { EmptyBlock } from "app/components/EmptyBlock";
import { LineGraph } from "app/components/Graphs/LineGraph";
import { usePortfolioBreakdown } from "domains/dashboard/hooks/use-portfolio-breakdown";
import React, { useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

import { LabelledText, Legend, Tooltip, PortfolioBreakdownSkeleton } from "./PortfolioBreakdown.blocks";
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

	const [, setIsDetailOpen] = useState(false); // @TODO add modal

	const { loading, balance, assets, walletsCount, ticker } = usePortfolioBreakdown({
		profile,
		profileIsSyncingExchangeRates,
	});

	const hasZeroBalance = useMemo(() => balance === 0, [balance]);

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
		<div className="py-4 px-6 bg-theme-secondary-100 rounded-xl flex">
			<LabelledText label={t("COMMON.YOUR_BALANCE")}>
				{(textClassName) => <Amount className={textClassName} ticker={ticker} value={balance} />}
			</LabelledText>

			<Divider size="xl" type="vertical" />

			<LabelledText label={t("COMMON.ASSETS")}>
				{(textClassName) => <span className={textClassName}>{assets.length}</span>}
			</LabelledText>

			<Divider size="xl" type="vertical" />

			<LabelledText label={t("COMMON.WALLETS")}>
				{(textClassName) => <span className={textClassName}>{walletsCount}</span>}
			</LabelledText>

			<div className="flex-1 ml-4">
				<LineGraph
					items={assets}
					mapper={getAssetsToDataPointsMapper(ticker, hasZeroBalance)}
					renderAsEmpty={hasZeroBalance}
					renderTooltip={(dataPoint) => <Tooltip dataPoint={dataPoint} />}
					renderLegend={(dataPoints) => (
						<Legend
							dataPoints={dataPoints}
							hasZeroBalance={hasZeroBalance}
							onMoreDetailsClick={() => setIsDetailOpen(true)}
						/>
					)}
				/>
			</div>
		</div>
	);
};
