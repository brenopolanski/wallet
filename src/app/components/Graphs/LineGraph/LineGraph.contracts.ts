export interface LineGraphDataPoint {
	color: string;
	label: string;
	percent: number;
	width: number;
	x: number;
}

export interface LineGraphGraphConfig {
	graphWidth: number;
	segmentSpacing: number;
	segmentHeight: number;
	segmentRadius: number;
}

export type LineGraphMapper<TDataPoint> = (data: TDataPoint[], config: LineGraphGraphConfig) => LineGraphDataPoint[];

export interface LineGraphProperties<TDataPoint> {
	data: TDataPoint[];
	mapper: LineGraphMapper<TDataPoint>;
}
