import React, { useMemo } from "react";

import { DonutGraphCircle, UseDonutGraphHook } from "./DonutGraph.contracts";

const GRAPH_MARGIN = 20;
const SEGMENT_SPACING = 20;
const RADIUS_HOVER_INCREMENT = 6;

interface DonutGraphConfig {
	circleCommonProperties: React.SVGProps<SVGCircleElement>;
	circumference: number;
	circumferenceHover: number;
	radius: number;
	radiusHover: number;
}

export const useDonutGraph: UseDonutGraphHook = (data, size) => {
	const {
		circleCommonProperties,
		circumference,
		circumferenceHover,
		radius,
		radiusHover,
	} = useMemo<DonutGraphConfig>(() => {
		const diameter = size - GRAPH_MARGIN * 2;
		const center = size / 2;

		const radius = diameter / 2;
		const radiusHover = radius + RADIUS_HOVER_INCREMENT;

		// Trigger mouseenter/mouseleave only when
		// target is a visible part of the circle.
		const pointerEvents = "visibleStroke";

		return {
			circleCommonProperties: {
				cx: center,
				cy: center,
				fill: "transparent",
				pointerEvents,
				r: radius,
				strokeLinecap: "round",
				strokeWidth: 16,
			},
			circumference: diameter * Math.PI,
			circumferenceHover: radiusHover * 2 * Math.PI,
			radius,
			radiusHover,
		};
	}, [size]);

	return useMemo(() => {
		const items: DonutGraphCircle[] = [];

		// When there is only 1 segment avoid showing
		// the space between start and end of it.
		const spacing = data.length > 1 ? SEGMENT_SPACING : 0;

		let strokeDashoffset = (spacing / 2) * -1;
		let strokeDashoffsetHover = strokeDashoffset;

		for (const { color, value } of data) {
			const dash = (circumference * value) / 100;
			const dashHover = (circumferenceHover * value) / 100;

			const gap = (circumference * (100 - value)) / 100;
			const gapHover = (circumferenceHover * (100 - value)) / 100;

			// This has to be equal to the sum of the lengths
			// of the previous segments or they will overlap.
			strokeDashoffset += dash;
			strokeDashoffsetHover += dashHover;

			const strokeDasharray = [dash - spacing, gap + spacing].join(" ");
			const strokeDasharrayHover = [dashHover - spacing, gapHover + spacing].join(" ");

			items.push({
				animations: [
					{
						attribute: "r",
						from: radius,
						to: radiusHover,
					},
					{
						attribute: "stroke-dasharray",
						from: strokeDasharray,
						to: strokeDasharrayHover,
					},
					{
						attribute: "stroke-dashoffset",
						from: strokeDashoffset,
						to: strokeDashoffsetHover,
					},
				],
				circleProperties: {
					...circleCommonProperties,
					className: `stroke-current text-theme-${color}`,
					strokeDasharray,
					strokeDashoffset,
				},
			});
		}

		return items;
	}, [circumference, data]); // eslint-disable-line react-hooks/exhaustive-deps
};
