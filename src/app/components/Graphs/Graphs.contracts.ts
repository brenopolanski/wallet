import React, { MouseEvent, MutableRefObject } from "react";

type GraphType = "line" | "donut";

interface GraphDataPoint {
	color: string;
	data: Record<string, any>;
	value: number;
}

const GRAPH_COLORS = ["success-600", "warning-600", "info-600", "danger-400", "hint-400", "secondary-400"];
const GRAPH_COLORS_DARK = ["success-600", "warning-600", "info-600", "danger-400", "hint-400", "secondary-600"];

const GRAPH_COLOR_EMPTY = "secondary-300";
const GRAPH_COLOR_EMPTY_DARK = "secondary-800";

const MIN_VALUE = 1;
const MIN_DISPLAY_VALUE_LINE = 2.5;
const MIN_DISPLAY_VALUE_DONUT = 5;

type UseGraphDataHook = (graphType: GraphType) => {
	normalizeData: (data: GraphDataPoint[]) => GraphDataPoint[];
};

type UseGraphWidthHook = () => [MutableRefObject<SVGSVGElement | null>, number];

type UseGraphTooltipHook = (
	renderFunction: ((dataPoint: GraphDataPoint) => JSX.Element) | undefined,
	type: GraphType,
) => {
	Tooltip: React.VFC;
	getMouseEventProperties: (dataPoint: GraphDataPoint) => {
		onMouseMove: (event: MouseEvent<SVGElement>) => void;
		onMouseOut: (event: MouseEvent<SVGElement>) => void;
	};
};

export type { GraphDataPoint, GraphType, UseGraphDataHook, UseGraphTooltipHook, UseGraphWidthHook };

export {
	GRAPH_COLOR_EMPTY,
	GRAPH_COLOR_EMPTY_DARK,
	GRAPH_COLORS,
	GRAPH_COLORS_DARK,
	MIN_DISPLAY_VALUE_DONUT,
	MIN_DISPLAY_VALUE_LINE,
	MIN_VALUE,
};
