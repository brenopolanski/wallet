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
	const { loading, assets } = usePortfolioBreakdown({
		profile,
		profileIsSyncingExchangeRates,
	});

	if (loading) {
		return <p>Loading</p>; // @TODO use proper skeleton
	}

	return (
		<div>
			<LineGraph data={assets} mapper={mapAssetsToDataPoints} />
		</div>
	);
};
