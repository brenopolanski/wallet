import { GraphHoverAnimation } from "app/components/Graphs/GraphHoverAnimation";
import { useGraphData, useGraphTooltip, useGraphWidth } from "app/components/Graphs/Graphs.shared";
import React, { useMemo } from "react";

import { LineGraphEmpty } from "./LineGraph.blocks";
import { BASE_CONFIG, LineGraphConfig, LineGraphProperties } from "./LineGraph.contracts";
import { useLineGraph } from "./LineGraph.helpers";

export const LineGraph: React.VFC<LineGraphProperties> = ({
	data,
	renderLegend,
	renderTooltip,
	renderAsEmpty,
	addToOtherGroup,
}) => {
	const [reference, graphWidth] = useGraphWidth();
	const { group } = useGraphData("line", addToOtherGroup);
	const { Tooltip, getMouseEventProperties } = useGraphTooltip(renderTooltip, "line");

	const config = useMemo<LineGraphConfig>(() => ({ ...BASE_CONFIG, graphWidth }), [graphWidth]);

	const normalizedData = group(data, config.graphWidth);
	const rectangles = useLineGraph(normalizedData, config);

	const renderSegments = () => {
		if (renderAsEmpty) {
			return <LineGraphEmpty config={config} />;
		}

		return rectangles.map((rectProperties, index) => (
			<g key={index} data-testid="LineGraph__item">
				<rect
					{...rectProperties}
					{...getMouseEventProperties(normalizedData[index])}
					y={0}
					rx={0}
					opacity={0}
					height={config.hoverAreaHeight}
					id={`rectHoverArea__${index}`}
					data-testid="LineGraph__item-hover-area"
					pointerEvents="visiblePainted"
				/>
				<rect {...rectProperties} pointerEvents="none">
					<GraphHoverAnimation
						targetElementId={`rectHoverArea__${index}`}
						animations={[
							{ attribute: "height", from: config.segmentHeight, to: config.segmentHeightHover },
							{ attribute: "rx", from: config.segmentHeight / 2, to: config.segmentHeightHover / 2 },
							{ attribute: "y", from: config.segmentHeight, to: 0 },
						]}
					/>
				</rect>
			</g>
		));
	};

	return (
		<div>
			<Tooltip />

			{!!renderLegend && (
				<div data-testid="LineGraph__legend" className="flex justify-end mb-1">
					{renderLegend(normalizedData)}
				</div>
			)}

			<svg ref={reference} className="w-full h-5" data-testid="LineGraph__svg">
				{!!graphWidth && renderSegments()}
			</svg>
		</div>
	);
};
