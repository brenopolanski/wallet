import { useGraphTooltip, useGraphWidth } from "app/components/Graphs/Graphs.shared";
import React, { useRef } from "react";

import { LineGraphLegend, LineGraphSegment } from "./LineGraph.blocks";
import { LineGraphDataPoint, LineGraphGraphConfig, LineGraphProperties } from "./LineGraph.contracts";

export function LineGraph<TDataType>({
	data,
	mapper,
	renderAfterLegend,
	renderTooltip,
}: LineGraphProperties<TDataType>): JSX.Element {
	const reference = useRef<SVGSVGElement | null>(null);
	const graphWidth = useGraphWidth(reference);

	const { Tooltip, getMouseEventProperties } = useGraphTooltip<LineGraphDataPoint, SVGRectElement>(renderTooltip);

	const config: LineGraphGraphConfig = {
		graphWidth,
		segmentHeight: 8,
		segmentHeightHover: 16,
		segmentSpacing: 8,
	};

	const dataPoints = mapper(data, config);

	return (
		<div>
			<Tooltip />

			<div className="flex justify-end mb-1">
				<LineGraphLegend dataPoints={dataPoints} />
				{renderAfterLegend?.()}
			</div>

			<svg ref={reference} className="w-full h-6">
				{!!graphWidth &&
					dataPoints.map((dataPoint, index) => (
						<LineGraphSegment
							key={index}
							config={config}
							dataPoint={dataPoint}
							{...getMouseEventProperties(dataPoint)}
						/>
					))}
			</svg>
		</div>
	);
}
