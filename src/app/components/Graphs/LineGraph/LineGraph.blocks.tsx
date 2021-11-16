import { GRAPH_COLOR_EMPTY } from "app/components/Graphs/Graphs.shared";
import React from "react";

import { LineGraphConfig } from "./LineGraph.contracts";

interface LineGraphAnimationProperties {
	animations: {
		attribute: string;
		from: number;
		to: number;
	}[];
}

const LineGraphAnimation: React.VFC<LineGraphAnimationProperties> = ({ animations }) => (
	<>
		{animations.map(({ attribute, from, to }, index) => (
			<React.Fragment key={index}>
				<animate attributeName={attribute} from={from} to={to} dur="0.1s" begin="mouseover" fill="freeze" />
				<animate attributeName={attribute} from={to} to={from} dur="0.15s" begin="mouseleave" fill="freeze" />
			</React.Fragment>
		))}
	</>
);

interface LineGraphEmptyProperties {
	config: LineGraphConfig;
}

const LineGraphEmpty: React.VFC<LineGraphEmptyProperties> = ({ config }) => (
	<rect
		x={0}
		y={config.segmentHeight}
		className={`fill-current text-theme-${GRAPH_COLOR_EMPTY}`}
		width={config.graphWidth}
		height={config.segmentHeight}
		rx={config.segmentHeight / 2}
	/>
);

export { LineGraphAnimation, LineGraphEmpty };
