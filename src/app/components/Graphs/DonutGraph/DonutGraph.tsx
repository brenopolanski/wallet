import { useDonutGraph } from "app/components/Graphs/DonutGraph/DonutGraph.helpers";
import { GraphHoverAnimation } from "app/components/Graphs/GraphHoverAnimation";
import { useGraphTooltip } from "app/components/Graphs/Graphs.shared";
import React from "react";

import { ContentInsideCircle } from "./DonutGraph.blocks";
import { DonutGraphProperties } from "./DonutGraph.contracts";

export const DonutGraph: React.VFC<DonutGraphProperties> = ({
	data,
	size,
	renderTooltip,
	renderContentInsideCircle,
}) => {
	const { circles, backgroundCircle } = useDonutGraph(data, size);

	const { Tooltip, getMouseEventProperties } = useGraphTooltip(renderTooltip, "donut");

	return (
		<div className="relative">
			<Tooltip />

			<ContentInsideCircle renderFunction={renderContentInsideCircle} size={size} />

			<svg width={size} height={size}>
				<circle {...backgroundCircle} />

				{circles.map(({ circleProperties, animations }, index) => (
					<g key={index}>
						<circle
							{...circleProperties}
							id={`circleTrackLine__${index}`}
							className="stroke-current text-theme-secondary-300 dark:text-theme-secondary-800"
							strokeWidth={2}
							pointerEvents="none"
						/>
						<circle
							{...circleProperties}
							id={`circleHoverArea__${index}`}
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
