type GraphType = "line" | "donut";

interface GraphDataPoint {
	color: string;
	data: Record<string, any>;
	value: number;
}

export type { GraphDataPoint, GraphType };
