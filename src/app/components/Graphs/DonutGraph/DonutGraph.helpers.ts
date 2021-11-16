import React, { useMemo } from "react";

import { DonutGraphDataPoint } from "./DonutGraph.contracts";

const GRAPH_MARGIN = 20;
const SEGMENT_SPACING = 16;

interface DonutGraphConfig {
	circleCommonProperties: React.SVGProps<SVGCircleElement>;
	circumference: number;
}

export const useDonutGraph = (data: DonutGraphDataPoint[], size: number): React.SVGProps<SVGCircleElement>[] => {
	const { circleCommonProperties, circumference } = useMemo<DonutGraphConfig>(() => {
		const diameter = size - GRAPH_MARGIN * 2;
		const radius = diameter / 2;
		const center = size / 2;

		return {
			circleCommonProperties: {
				cx: center,
				cy: center,
				fill: "transparent",
				r: radius,
				strokeLinecap: "round",
				strokeWidth: 16,
			},
			circumference: diameter * Math.PI,
		};
	}, [size]);

	return useMemo<React.SVGProps<SVGCircleElement>[]>(() => {
		const circles: React.SVGProps<SVGCircleElement>[] = [];

		// When there is only 1 segment avoid showing
		// the space between start and end of it.
		const spacing = data.length > 1 ? SEGMENT_SPACING : 0;

		let strokeDashoffset = (spacing / 2) * -1;

		for (const { color, value } of data) {
			const dash = (circumference * value) / 100;
			const gap = (circumference * (100 - value)) / 100;

			// This has to be equal to the sum of the lengths
			// of the previous segments or they will overlap.
			strokeDashoffset += dash;

			circles.push({
				...circleCommonProperties,
				className: `stroke-current text-theme-${color}`,
				strokeDasharray: [dash - spacing, gap + spacing].join(" "),
				strokeDashoffset,
			});
		}

		return circles;
	}, [circumference, data]); // eslint-disable-line react-hooks/exhaustive-deps
};
