import { LineGraphDataPoint } from "app/components/Graphs/LineGraph/LineGraph.contracts";

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

export type { LabelledTextProperties, LegendProperties, TooltipProperties };
