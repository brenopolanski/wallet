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

type LineGraphMapper<TDataPoint> = (data: TDataPoint[], config: LineGraphGraphConfig) => LineGraphDataPoint[];

interface LineGraphProperties<TDataPoint> {
	data: TDataPoint[];
	mapper: LineGraphMapper<TDataPoint>;
}

export type {
	LineGraphDataPoint,
	LineGraphGraphConfig,
	LineGraphMapper,
	LineGraphProperties,
	LineGraphSegmentProperties,
};
