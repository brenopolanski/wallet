import { GraphDataPoint } from "app/components/Graphs/Graphs.contracts";

interface AssetItem {
	amount: number;
	convertedAmount: number;
	label: string;
	percent: number;
}

interface LegendProperties {
	dataPoints: GraphDataPoint[];
	hasZeroBalance: boolean;
	onMoreDetailsClick: () => void;
}

interface LabelledTextProperties {
	label: string;
	children: (textClassName: string) => JSX.Element;
}

interface TooltipProperties {
	dataPoint: GraphDataPoint;
}

export type { AssetItem, LabelledTextProperties, LegendProperties, TooltipProperties };
