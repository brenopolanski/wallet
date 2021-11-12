import { useGraphFormatter } from "app/components/Graphs/Graphs.shared";
import React from "react";

import {
	LineGraphAnimationProperties,
	LineGraphLegendProperties,
	LineGraphSegmentProperties,
} from "./LineGraph.contracts";

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

export const LineGraphLegend: React.VFC<LineGraphLegendProperties> = ({ dataPoints }) => {
	const { formatPercent } = useGraphFormatter();

	return (
		<div className="flex space-x-4">
			{dataPoints.map(({ color, label, percent }, index) => (
				<div className="flex items-center space-x-1" key={index}>
					<div className={`h-3 w-1 rounded bg-theme-${color}`} />
					<div className="text-sm font-semibold text-theme-secondary-700 dark:text-theme-secondary-200">
						{label}
					</div>
					<div className="text-sm font-semibold text-theme-secondary-500 dark:text-theme-secondary-700">
						{formatPercent(percent)}
					</div>
				</div>
			))}
		</div>
	);
};
