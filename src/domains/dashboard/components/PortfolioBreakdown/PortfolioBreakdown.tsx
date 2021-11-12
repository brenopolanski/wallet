import { Contracts } from "@payvo/profiles";
import { Amount } from "app/components/Amount";
import { Divider } from "app/components/Divider";
import { LineGraph } from "app/components/Graphs/LineGraph";
import { usePortfolioBreakdown } from "domains/dashboard/hooks/use-portfolio-breakdown";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { LabelledText, MoreDetailsButton, Tooltip } from "./PortfolioBreakdown.blocks";
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

	const { loading, convertedBalance, assets, walletsCount, ticker } = usePortfolioBreakdown({
		profile,
		profileIsSyncingExchangeRates,
	});

	if (loading && assets.length === 0) {
		return <p>Loading</p>; // @TODO use proper skeleton
	}

	// @TODO improve dark mode styles

	return (
		<div className="py-4 px-6 bg-theme-secondary-100 rounded-xl flex">
			<LabelledText label={t("COMMON.YOUR_BALANCE")}>
				{(textClassName) => <Amount className={textClassName} ticker={ticker} value={convertedBalance} />}
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
					data={assets}
					mapper={getAssetsToDataPointsMapper(ticker)}
					renderAfterLegend={() => <MoreDetailsButton onClick={() => setIsDetailOpen(true)} />}
					renderTooltip={(dataPoint) => <Tooltip dataPoint={dataPoint} />}
				/>
			</div>
		</div>
	);
};
