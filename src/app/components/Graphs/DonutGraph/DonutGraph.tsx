import { GraphHoverAnimation } from "app/components/Graphs/GraphHoverAnimation";
import React from "react";

import { DonutGraphProperties } from "./DonutGraph.contracts";
import { useDonutGraph } from "./DonutGraph.helpers";

export const DonutGraph: React.VFC<DonutGraphProperties> = ({ data, size }) => {
	const { circles, backgroundCircle } = useDonutGraph(data, size);

	return (
		<svg width={size} height={size}>
			<circle {...backgroundCircle} />

			{circles.map(({ circleProperties, animations }, index) => (
				<g key={index}>
					<circle
						{...circleProperties}
						id={`circleTrackLine__${index}`}
						className="stroke-current text-theme-secondary-300"
						strokeWidth={2}
						pointerEvents="none"
					/>
					<circle
						{...circleProperties}
						id={`circleHoverArea__${index}`}
						strokeWidth={40}
						opacity={0}
						pointerEvents="visibleStroke"
					/>
					<circle {...circleProperties} pointerEvents="none">
						<GraphHoverAnimation targetElementId={`circleHoverArea__${index}`} animations={animations} />
					</circle>
				</g>
			))}
		</svg>
	);
};
