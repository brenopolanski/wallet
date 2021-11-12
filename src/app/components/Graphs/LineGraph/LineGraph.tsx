import { useGraphWidth } from "app/components/Graphs/Graphs.shared";
import React, { useRef } from "react";

import { LineGraphSegment } from "./LineGraph.blocks";
import { LineGraphGraphConfig, LineGraphProperties } from "./LineGraph.contracts";

export function LineGraph<TDataType>({ data, mapper }: LineGraphProperties<TDataType>): JSX.Element {
	const reference = useRef<SVGSVGElement | null>(null);
	const graphWidth = useGraphWidth(reference);

	const config: LineGraphGraphConfig = {
		graphWidth,
		segmentHeight: 8,
		segmentHeightHover: 16,
		segmentSpacing: 8,
	};

	return (
		<svg ref={reference} className="w-full">
			{!!graphWidth &&
				mapper(data, config).map((dataPoint, index) => (
					<LineGraphSegment config={config} dataPoint={dataPoint} key={index} />
				))}
		</svg>
	);
}
