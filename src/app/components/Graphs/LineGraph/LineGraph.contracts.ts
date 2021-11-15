import React from "react";

interface LineGraphDataPoint {
	color: string;
	data: Record<string, any>;
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
	onMouseMove?: (event: React.MouseEvent<SVGRectElement>) => void;
	onMouseOut?: (event: React.MouseEvent<SVGRectElement>) => void;
}

interface LineGraphAnimationProperties {
	animations: {
		attribute: string;
		from: number;
		to: number;
	}[];
}

type LineGraphMapper<TItem> = (items: TItem[], config: LineGraphGraphConfig) => LineGraphDataPoint[];

interface LineGraphProperties<TItem> {
	items: TItem[];
	mapper: LineGraphMapper<TItem>;
	renderLegend?: (dataPoints: LineGraphDataPoint[]) => JSX.Element;
	renderTooltip?: (dataPoint: LineGraphDataPoint) => JSX.Element;
	renderAsEmpty?: boolean;
}

export type {
	LineGraphAnimationProperties,
	LineGraphDataPoint,
	LineGraphGraphConfig,
	LineGraphMapper,
	LineGraphProperties,
	LineGraphSegmentProperties,
};
