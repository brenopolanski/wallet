import { GRAPH_COLOR_EMPTY, useGraphTooltip, useGraphWidth } from "app/components/Graphs/Graphs.shared";
import React, { useRef } from "react";

import { LineGraphSegment } from "./LineGraph.blocks";
import { LineGraphConfig, LineGraphDataPoint, LineGraphProperties } from "./LineGraph.contracts";

export function LineGraph<TItem>({
	items,
	mapper,
	renderLegend,
	renderTooltip,
	renderAsEmpty,
}: LineGraphProperties<TItem>): JSX.Element {
	const reference = useRef<SVGSVGElement | null>(null);
	const graphWidth = useGraphWidth(reference);

	const { Tooltip, getMouseEventProperties } = useGraphTooltip<LineGraphDataPoint, SVGRectElement>(renderTooltip);

	const config: LineGraphConfig = {
		graphWidth,
		segmentHeight: 8,
		segmentHeightHover: 16,
		segmentSpacing: 8,
	};

	const dataPoints = mapper(items, config);

	const renderSegments = () => {
		if (renderAsEmpty) {
			return (
				<rect
					x={0}
					y={config.segmentHeight}
					className={`fill-current text-theme-${GRAPH_COLOR_EMPTY}`}
					width={graphWidth}
					height={config.segmentHeight}
					rx={config.segmentHeight / 2}
				/>
			);
		}

		return dataPoints.map((dataPoint, index) => (
			<LineGraphSegment
				key={index}
				config={config}
				dataPoint={dataPoint}
				{...getMouseEventProperties(dataPoint)}
			/>
		));
	};

	return (
		<div>
			<Tooltip />

			{!!renderLegend && <div className="flex justify-end mb-1">{renderLegend(dataPoints)}</div>}

			<svg ref={reference} className="w-full h-5">
				{!!graphWidth && renderSegments()}
			</svg>
		</div>
	);
}
