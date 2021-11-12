interface LineGraphDataPoint {
	color: string;
	label: string;
	percent: number;
	width: number;
	x: number;
}

interface LineGraphGraphConfig {
	graphWidth: number;
	segmentHeight: number;
	segmentHeightHover: number;
	segmentSpacing: number;
}

interface LineGraphSegmentProperties {
	config: LineGraphGraphConfig;
	dataPoint: LineGraphDataPoint;
}

interface LineGraphLegendProperties {
	dataPoints: LineGraphDataPoint[];
}

interface LineGraphAnimationProperties {
	animations: {
		attribute: string;
		from: number;
		to: number;
	}[];
}

type LineGraphMapper<TDataPoint> = (data: TDataPoint[], config: LineGraphGraphConfig) => LineGraphDataPoint[];

interface LineGraphProperties<TDataPoint> {
	data: TDataPoint[];
	mapper: LineGraphMapper<TDataPoint>;
	renderAfterLegend?: () => JSX.Element;
}

export type {
	LineGraphAnimationProperties,
	LineGraphDataPoint,
	LineGraphGraphConfig,
	LineGraphLegendProperties,
	LineGraphMapper,
	LineGraphProperties,
	LineGraphSegmentProperties,
};
