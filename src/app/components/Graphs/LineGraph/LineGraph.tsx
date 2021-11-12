import { useGraphWidth } from "app/components/Graphs/Graphs.shared";
import React, { useRef } from "react";

import { LineGraphGraphConfig, LineGraphProperties } from "./LineGraph.contracts";

export function LineGraph<TDataType>({ data, mapper }: LineGraphProperties<TDataType>): JSX.Element {
	const reference = useRef<SVGSVGElement | null>(null);
	const graphWidth = useGraphWidth(reference);

	const config: LineGraphGraphConfig = {
		graphWidth,
		segmentHeight: 8,
		segmentRadius: 4,
		segmentSpacing: 8,
	};

	return (
		<svg ref={reference} className="w-full">
			{!!graphWidth &&
				mapper(data, config).map(({ width, x, color }, index) => (
					<rect
						x={x}
						y={0}
						key={index}
						className={`fill-current text-theme-${color}`}
						width={width}
						height={config.segmentHeight}
						rx={config.segmentRadius}
						ry={config.segmentRadius}
					/>
				))}
		</svg>
	);
}
