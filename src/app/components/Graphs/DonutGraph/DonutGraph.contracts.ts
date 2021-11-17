interface DonutGraphDataPoint {
	color: string;
	data: Record<string, any>;
	value: number;
}

interface DonutGraphProperties {
	data: DonutGraphDataPoint[];
	size: number;
	renderTooltip?: (dataPoint: DonutGraphDataPoint) => JSX.Element;
	renderContentInsideCircle?: () => JSX.Element;
}

export type { DonutGraphDataPoint, DonutGraphProperties };
