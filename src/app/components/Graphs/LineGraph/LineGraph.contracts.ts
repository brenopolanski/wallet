interface LineGraphDataPoint {
	color: string;
	data: Record<string, any>;
	value: number;
}

interface LineGraphConfig {
	graphWidth: number;
	segmentHeight: number;
	segmentHeightHover: number;
	segmentSpacing: number;
}

interface LineGraphProperties {
	data: LineGraphDataPoint[];
	renderLegend?: (dataPoints: LineGraphDataPoint[]) => JSX.Element;
	renderTooltip?: (dataPoint: LineGraphDataPoint) => JSX.Element;
	renderAsEmpty?: boolean;
}

export type { LineGraphConfig, LineGraphDataPoint, LineGraphProperties };
