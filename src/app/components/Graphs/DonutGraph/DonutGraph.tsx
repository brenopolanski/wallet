import { useDonutGraph } from "app/components/Graphs/DonutGraph/DonutGraph.helpers";
import { GraphHoverAnimation } from "app/components/Graphs/GraphHoverAnimation";
import { useGraphData, useGraphTooltip } from "app/components/Graphs/Graphs.shared";
import React from "react";

import { ContentInsideCircle } from "./DonutGraph.blocks";
import { DonutGraphProperties } from "./DonutGraph.contracts";

export const DonutGraph: React.VFC<DonutGraphProperties> = ({
	data,
	size,
	renderTooltip,
	renderContentInsideCircle,
}) => {
	const { normalizeData } = useGraphData("donut");
	const { Tooltip, getMouseEventProperties } = useGraphTooltip(renderTooltip, "donut");

	const normalizedData = normalizeData(data);
	const { circles, backgroundCircle } = useDonutGraph(normalizedData, size);

	return (
		<div className="relative">
			<Tooltip />

			<ContentInsideCircle renderFunction={renderContentInsideCircle} size={size} />

			<svg width={size} height={size} data-testid="DonutGraph__svg">
				<circle {...backgroundCircle} />

				{circles.map(({ circleProperties, animations }, index) => (
					<g key={index} data-testid="DonutGraph__item">
						<circle
							{...circleProperties}
							id={`circleTrackLine__${index}`}
							data-testid="DonutGraph__item-track-line"
							className="stroke-current text-theme-secondary-300 dark:text-theme-secondary-800"
							strokeWidth={2}
							pointerEvents="none"
						/>
						<circle
							{...circleProperties}
							id={`circleHoverArea__${index}`}
							data-testid="DonutGraph__item-hover-area"
							strokeWidth={40}
							opacity={0}
							pointerEvents="visibleStroke"
							{...getMouseEventProperties(data[index])}
						/>
						<circle {...circleProperties} pointerEvents="none">
							<GraphHoverAnimation
								targetElementId={`circleHoverArea__${index}`}
								animations={animations}
							/>
						</circle>
					</g>
				))}
			</svg>
		</div>
	);
};
