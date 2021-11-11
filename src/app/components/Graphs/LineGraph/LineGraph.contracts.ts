export interface LineGraphDataItem {
	label: string;
	value: number;
}

export type LineGraphData = LineGraphDataItem[];

export interface LineGraphProperties {
	data: LineGraphData;
}
