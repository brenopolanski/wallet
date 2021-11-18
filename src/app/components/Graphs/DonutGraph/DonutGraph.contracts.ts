import { GraphDataPoint } from "app/components/Graphs/Graphs.contracts";

interface DonutGraphProperties {
	data: GraphDataPoint[];
	size: number;
	renderTooltip?: (dataPoint: GraphDataPoint) => JSX.Element;
	renderContentInsideCircle?: () => JSX.Element;
}

export type { DonutGraphProperties };
