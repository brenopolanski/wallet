import { GraphHoverAnimation } from "app/components/Graphs/GraphHoverAnimation";
import { useGraphData, useGraphTooltip, useGraphWidth } from "app/components/Graphs/Graphs.shared";
import React, { useCallback, useMemo } from "react";

import { LineGraphEmpty } from "./LineGraph.blocks";
import { LineGraphConfig, LineGraphProperties } from "./LineGraph.contracts";
import { useLineGraph } from "./LineGraph.helpers";

export const LineGraph: React.VFC<LineGraphProperties> = ({ data, renderLegend, renderTooltip, renderAsEmpty }) => {
	const [reference, graphWidth] = useGraphWidth();
	const { normalizeData } = useGraphData("line");
	const { Tooltip, getMouseEventProperties } = useGraphTooltip(renderTooltip, "line");

	const config = useMemo<LineGraphConfig>(
		() => ({
			graphWidth,
			segmentHeight: 8,
			segmentHeightHover: 16,
			segmentSpacing: 8,
		}),
		[graphWidth],
	);

	const normalizedData = normalizeData(data);
	const rectangles = useLineGraph(normalizedData, config);

	const renderSegments = useCallback(() => {
		if (renderAsEmpty) {
			return <LineGraphEmpty config={config} />;
		}

		return rectangles.map((rectProperties, index) => (
			<rect
				key={index}
				data-testid="LineGraph__item"
				{...rectProperties}
				{...getMouseEventProperties(data[index])}
			>
				<GraphHoverAnimation
					animations={[
						{ attribute: "height", from: config.segmentHeight, to: config.segmentHeightHover },
						{ attribute: "rx", from: config.segmentHeight / 2, to: config.segmentHeightHover / 2 },
						{ attribute: "y", from: config.segmentHeight, to: 0 },
					]}
				/>
			</rect>
		));
	}, [config, data, getMouseEventProperties, rectangles, renderAsEmpty]);

	return (
		<div>
			<Tooltip />

			{!!renderLegend && (
				<div data-testid="LineGraph__legend" className="flex justify-end mb-1">
					{renderLegend(data)}
				</div>
			)}

			<svg ref={reference} className="w-full h-5" data-testid="LineGraph__svg">
				{!!graphWidth && renderSegments()}
			</svg>
		</div>
	);
};
