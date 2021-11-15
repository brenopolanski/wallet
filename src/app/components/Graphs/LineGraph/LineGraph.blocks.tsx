import React from "react";

import { LineGraphAnimationProperties, LineGraphSegmentProperties } from "./LineGraph.contracts";

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

export const LineGraphSegment: React.VFC<LineGraphSegmentProperties> = ({
	config: { segmentHeight, segmentHeightHover },
	dataPoint: { x, width, color },
	onMouseMove,
	onMouseOut,
}) => (
	<rect
		onMouseMove={onMouseMove}
		onMouseOut={onMouseOut}
		x={x}
		y={segmentHeight}
		className={`fill-current text-theme-${color}`}
		width={width}
		height={segmentHeight}
		rx={segmentHeight / 2}
	>
		<LineGraphAnimation
			animations={[
				{ attribute: "height", from: segmentHeight, to: segmentHeightHover },
				{ attribute: "rx", from: segmentHeight / 2, to: segmentHeightHover / 2 },
				{ attribute: "y", from: segmentHeight, to: 0 },
			]}
		/>
	</rect>
);
