import { GraphHoverAnimation } from "app/components/Graphs/GraphHoverAnimation";
import { useGraphTooltip } from "app/components/Graphs/Graphs.shared";
import React from "react";

import { DonutGraphProperties } from "./DonutGraph.contracts";
import { useContentInsideCircle, useDonutGraph } from "./DonutGraph.helpers";

export const DonutGraph: React.VFC<DonutGraphProperties> = ({
	data,
	size,
	renderTooltip,
	renderContentInsideCircle,
}) => {
	const { circles, backgroundCircle } = useDonutGraph(data, size);

	const { Tooltip, getMouseEventProperties } = useGraphTooltip(renderTooltip, "donut");
	const { ContentInsideCircle } = useContentInsideCircle(renderContentInsideCircle, size);

	return (
		<div className="relative">
			<Tooltip />

			<svg width={size} height={size}>
				<circle {...backgroundCircle}>
					<ContentInsideCircle />
				</circle>

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
