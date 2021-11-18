import { GRAPH_COLOR_EMPTY, GRAPH_COLOR_EMPTY_DARK } from "app/components/Graphs/Graphs.shared";
import React from "react";

import { LineGraphConfig } from "./LineGraph.contracts";

interface LineGraphEmptyProperties {
	config: LineGraphConfig;
}

const LineGraphEmpty: React.VFC<LineGraphEmptyProperties> = ({ config }) => (
	<rect
		x={0}
		y={config.segmentHeight}
		className={`fill-current text-theme-${GRAPH_COLOR_EMPTY} dark:text-theme-${GRAPH_COLOR_EMPTY_DARK}`}
		width={config.graphWidth}
		height={config.segmentHeight}
		rx={config.segmentHeight / 2}
		data-testid="LineGraph__empty"
	/>
);

export { LineGraphEmpty };
