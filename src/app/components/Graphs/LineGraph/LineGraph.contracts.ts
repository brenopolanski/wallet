import { GraphDataPoint } from "app/components/Graphs/Graphs.contracts";

interface LineGraphConfig {
	graphWidth: number;
	segmentHeight: number;
	segmentHeightHover: number;
	segmentSpacing: number;
}

interface LineGraphProperties {
	data: GraphDataPoint[];
	renderLegend?: (dataPoints: GraphDataPoint[]) => JSX.Element;
	renderTooltip?: (dataPoint: GraphDataPoint) => JSX.Element;
	renderAsEmpty?: boolean;
}

export type { LineGraphConfig, LineGraphProperties };
