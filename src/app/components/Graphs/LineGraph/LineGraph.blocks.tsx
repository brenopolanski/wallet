import React, { useMemo, useState } from "react";

import { LineGraphLegendProperties, LineGraphSegmentProperties } from "./LineGraph.contracts";
import { useGraphFormatter } from "app/components/Graphs/Graphs.shared";

export const LineGraphSegment: React.VFC<LineGraphSegmentProperties> = ({
	config: { segmentHeight, segmentHeightHover },
	dataPoint: { x, width, color },
}) => {
	const [isHover, setIsHover] = useState(false);

	const [height, y] = useMemo<[number, number]>(
		() => (isHover ? [segmentHeightHover, 0] : [segmentHeight, segmentHeight]),
		[segmentHeight, segmentHeightHover, isHover],
	);

	return (
		<rect
			onMouseEnter={() => setIsHover(true)}
			onMouseLeave={() => setIsHover(false)}
			x={x}
			y={y}
			className={`fill-current text-theme-${color}`}
			width={width}
			height={height}
			rx={height / 2}
		/>
	);
};

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
