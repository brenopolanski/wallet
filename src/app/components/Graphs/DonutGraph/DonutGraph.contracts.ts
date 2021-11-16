import { GraphAnimation } from "app/components/Graphs/GraphHoverAnimation/GraphHoverAnimation.contract";
import React from "react";

interface DonutGraphDataPoint {
	color: string;
	data: Record<string, any>;
	value: number;
}

interface DonutGraphProperties {
	data: DonutGraphDataPoint[];
	size: number;
	renderTooltip?: (dataPoint: DonutGraphDataPoint) => JSX.Element;
}

interface DonutGraphCircle {
	circleProperties: React.SVGProps<SVGCircleElement>;
	animations: GraphAnimation[];
}

type UseDonutGraphHook = (data: DonutGraphDataPoint[], size: number) => DonutGraphCircle[];

export type { DonutGraphCircle, DonutGraphDataPoint, DonutGraphProperties, UseDonutGraphHook };
