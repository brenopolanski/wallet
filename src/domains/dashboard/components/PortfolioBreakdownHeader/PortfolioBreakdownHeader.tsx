import { Contracts } from "@payvo/profiles";
import { LineGraph } from "app/components/Graphs/LineGraph";
import { usePortfolioBreakdown } from "domains/dashboard/hooks/use-portfolio-breakdown";
import React from "react";

interface PortfolioBreakdownHeaderProperties {
	profile: Contracts.IProfile;
	profileIsSyncingExchangeRates: boolean;
}

export const PortfolioBreakdownHeader: React.VFC<PortfolioBreakdownHeaderProperties> = ({
	profile,
	profileIsSyncingExchangeRates,
}) => {
	const { assets, loading } = usePortfolioBreakdown({
		profile,
		profileIsSyncingExchangeRates,
	});

	if (loading) {
		return <p>Loading</p>; // @TODO use proper skeleton
	}

	return (
		<LineGraph
			data={assets.map(({ convertedAmount, label }) => ({
				label,
				value: convertedAmount,
			}))}
		/>
	);
};
