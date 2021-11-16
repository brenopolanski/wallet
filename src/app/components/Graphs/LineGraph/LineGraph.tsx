import { useGraphTooltip, useGraphWidth } from "app/components/Graphs/Graphs.shared";
import React from "react";

import { LineGraphAnimation, LineGraphEmpty } from "./LineGraph.blocks";
import { LineGraphConfig, LineGraphDataPoint, LineGraphProperties } from "./LineGraph.contracts";
import { useLineGraph } from "./LineGraph.helpers";

export const LineGraph: React.VFC<LineGraphProperties> = ({ data, renderLegend, renderTooltip, renderAsEmpty }) => {
	const [reference, graphWidth] = useGraphWidth<SVGSVGElement>();

	const { Tooltip, getMouseEventProperties } = useGraphTooltip<LineGraphDataPoint, SVGRectElement>(renderTooltip);

	const config: LineGraphConfig = {
		graphWidth,
		segmentHeight: 8,
		segmentHeightHover: 16,
		segmentSpacing: 8,
	};

	const rectangles = useLineGraph(data, config);

	const renderSegments = () => {
		if (renderAsEmpty) {
			return <LineGraphEmpty config={config} />;
		}

		return rectangles.map((rectProperties, index) => (
			<rect key={index} {...rectProperties} {...getMouseEventProperties(data[index])}>
				<LineGraphAnimation
					animations={[
						{ attribute: "height", from: config.segmentHeight, to: config.segmentHeightHover },
						{ attribute: "rx", from: config.segmentHeight / 2, to: config.segmentHeightHover / 2 },
						{ attribute: "y", from: config.segmentHeight, to: 0 },
					]}
				/>
			</rect>
		));
	};

	return (
		<div>
			<Tooltip />

			{!!renderLegend && <div className="flex justify-end mb-1">{renderLegend(data)}</div>}

			<svg ref={reference} className="w-full h-5">
				{!!graphWidth && renderSegments()}
			</svg>
		</div>
	);
};
