import { sortByDesc } from "@arkecosystem/utils";
import { Helpers } from "@payvo/profiles";
import { GRAPH_COLOR_EMPTY, GRAPH_COLORS } from "app/components/Graphs/Graphs.shared";
import { LineGraphDataPoint, LineGraphMapper } from "app/components/Graphs/LineGraph/LineGraph.contracts";
import { AssetItem } from "domains/dashboard/hooks/use-portfolio-breakdown";

const getColor = (index: number): string => {
	if (GRAPH_COLORS[index]) {
		return GRAPH_COLORS[index];
	}

	return GRAPH_COLORS[GRAPH_COLORS.length - 1];
};

export const getAssetsToDataPointsMapper: (ticker: string, hasZeroBalance: boolean) => LineGraphMapper<AssetItem> = (
	ticker,
	hasZeroBalance,
) => (items, { graphWidth, segmentSpacing }) => {
	if (hasZeroBalance) {
		return items.map((item) => ({
			color: GRAPH_COLOR_EMPTY,
			data: {
				amountFormatted: Helpers.Currency.format(0, ticker),
				label: item.label,
				percentFormatted: `0%`,
			},
			width: 0,
			x: 0,
		}));
	}

	const assets = sortByDesc(items, "percent");

	const dataPoints: LineGraphDataPoint[] = [];

	for (let index = 0; index < items.length; index++) {
		const asset = assets[index];

		let width = (asset.percent * graphWidth) / 100;
		let x = 0;

		if (index > 0) {
			// Calculate x position based on width and X of the previous segment, and add spacing.
			x = dataPoints[index - 1].x + dataPoints[index - 1].width + segmentSpacing;
		}

		if (index < items.length - 1) {
			// Decrease width by spacing to every item except the last one.
			width -= segmentSpacing;
		}

		dataPoints.push({
			color: getColor(index),
			data: {
				amountFormatted: Helpers.Currency.format(asset.convertedAmount, ticker),
				label: asset.label,
				percentFormatted: `${Math.round(((asset.percent || 0) + Number.EPSILON) * 100) / 100}%`,
			},
			width,
			x,
		});
	}

	return dataPoints;
};
