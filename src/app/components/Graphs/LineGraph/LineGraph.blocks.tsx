import React, { useMemo, useState } from "react";

import { LineGraphSegmentProperties } from "./LineGraph.contracts";

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
