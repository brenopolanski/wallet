import React from "react";

import { DonutGraphProperties } from "./DonutGraph.contracts";
import { useDonutGraph } from "./DonutGraph.helpers";

export const DonutGraph: React.VFC<DonutGraphProperties> = ({ data, size }) => {
	const circles = useDonutGraph(data, size);

	return (
		<svg width={size} height={size}>
			{circles.map((circleProperties, index) => (
				<circle key={index} {...circleProperties} />
			))}
		</svg>
	);
};
