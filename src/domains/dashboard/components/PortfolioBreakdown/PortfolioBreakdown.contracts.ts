import { LineGraphDataPoint } from "app/components/Graphs/LineGraph/LineGraph.contracts";

interface AssetItem {
	amount: number;
	convertedAmount: number;
	label: string;
	percent: number;
}

interface LegendProperties {
	dataPoints: LineGraphDataPoint[];
	hasZeroBalance: boolean;
	onMoreDetailsClick: () => void;
}

interface LabelledTextProperties {
	label: string;
	children: (textClassName: string) => JSX.Element;
}

interface TooltipProperties {
	dataPoint: LineGraphDataPoint;
}

export type { AssetItem, LabelledTextProperties, LegendProperties, TooltipProperties };
