import { useGraphWidth } from "app/components/Graphs/Graphs.shared";
import React, { useRef } from "react";

import { LineGraphLegend, LineGraphSegment } from "./LineGraph.blocks";
import { LineGraphGraphConfig, LineGraphProperties } from "./LineGraph.contracts";

export function LineGraph<TDataType>({ data, mapper, renderAfterLegend }: LineGraphProperties<TDataType>): JSX.Element {
	const reference = useRef<SVGSVGElement | null>(null);
	const graphWidth = useGraphWidth(reference);

	const config: LineGraphGraphConfig = {
		graphWidth,
		segmentHeight: 8,
		segmentHeightHover: 16,
		segmentSpacing: 8,
	};

	const dataPoints = mapper(data, config);

	return (
		<div>
			<div className="flex justify-end mb-1">
				<LineGraphLegend dataPoints={dataPoints} />
				{renderAfterLegend?.()}
			</div>

			<svg ref={reference} className="w-full">
				{!!graphWidth &&
					dataPoints.map((dataPoint, index) => (
						<LineGraphSegment config={config} dataPoint={dataPoint} key={index} />
					))}
			</svg>
		</div>
	);
}
