import { Contracts } from "@payvo/profiles";
import { LineGraph } from "app/components/Graphs/LineGraph";
import { usePortfolioBreakdown } from "domains/dashboard/hooks/use-portfolio-breakdown";
import React from "react";

import { mapAssetsToDataPoints } from "./PortfolioBreakdownHeader.helpers";

interface PortfolioBreakdownHeaderProperties {
	profile: Contracts.IProfile;
	profileIsSyncingExchangeRates: boolean;
}

export const PortfolioBreakdownHeader: React.VFC<PortfolioBreakdownHeaderProperties> = ({
	profile,
	profileIsSyncingExchangeRates,
}) => {
	const { loading } = usePortfolioBreakdown({
		profile,
		profileIsSyncingExchangeRates,
	});

	if (loading) {
		return <p>Loading</p>; // @TODO use proper skeleton
	}

	return (
		<div>
			<LineGraph
				data={[
					{
						amount: 20,
						convertedAmount: 20,
						label: "ARK",
						percent: 20,
					},
					{
						amount: 30,
						convertedAmount: 30,
						label: "BTC",
						percent: 30,
					},
					{
						amount: 50,
						convertedAmount: 50,
						label: "ETH",
						percent: 50,
					},
				]}
				mapper={mapAssetsToDataPoints}
				renderAfterLegend={() => <p>after legend</p>}
			/>
		</div>
	);
};
