import React from "react";

interface LineGraphDataPoint {
	color: string;
	data: Record<string, any>;
	width: number;
	x: number;
}

interface LineGraphConfig {
	graphWidth: number;
	segmentHeight: number;
	segmentHeightHover: number;
	segmentSpacing: number;
}

interface LineGraphSegmentProperties {
	config: LineGraphConfig;
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

type LineGraphMapper<TItem> = (items: TItem[], config: LineGraphConfig) => LineGraphDataPoint[];

interface LineGraphProperties<TItem> {
	items: TItem[];
	mapper: LineGraphMapper<TItem>;
	renderLegend?: (dataPoints: LineGraphDataPoint[]) => JSX.Element;
	renderTooltip?: (dataPoint: LineGraphDataPoint) => JSX.Element;
	renderAsEmpty?: boolean;
}

export type {
	LineGraphAnimationProperties,
	LineGraphConfig,
	LineGraphDataPoint,
	LineGraphMapper,
	LineGraphProperties,
	LineGraphSegmentProperties,
};
