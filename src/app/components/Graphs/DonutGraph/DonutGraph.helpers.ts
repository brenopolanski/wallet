import { GraphAnimation } from "app/components/Graphs/GraphHoverAnimation/GraphHoverAnimation.contract";
import React, { useMemo } from "react";

import { DonutGraphDataPoint } from "./DonutGraph.contracts";

const BACKGROUND_CIRCLE_SPACING = 16;
const GRAPH_MARGIN = 32;
const RADIUS_HOVER_INCREMENT = 16;
const SEGMENT_SPACING = 20;

const MIN_VALUE = 1;
const MIN_DISPLAY_VALUE = 5;

interface DonutGraphConfig {
	circleCommonProperties: React.SVGProps<SVGCircleElement>;
	circumference: number;
	circumferenceHover: number;
	radius: number;
	radiusHover: number;
}

interface DonutGraphCircle {
	circleProperties: React.SVGProps<SVGCircleElement>;
	animations: GraphAnimation[];
}

interface UseDonutGraphResult {
	backgroundCircle: React.SVGProps<SVGCircleElement>;
	circles: DonutGraphCircle[];
}

const useDonutGraph = (data: DonutGraphDataPoint[], size: number): UseDonutGraphResult => {
	const { circleCommonProperties, circumference, circumferenceHover, radius, radiusHover } =
		useMemo<DonutGraphConfig>(() => {
			const diameter = size - GRAPH_MARGIN * 2;
			const center = size / 2;

			const radius = diameter / 2;
			const radiusHover = radius + RADIUS_HOVER_INCREMENT;

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
				circumferenceHover: radiusHover * 2 * Math.PI,
				radius,
				radiusHover,
			};
		}, [size]);

	const backgroundCircle = useMemo<React.SVGProps<SVGCircleElement>>(
		() => ({
			...circleCommonProperties,
			className: "fill-current text-theme-secondary-200 dark:text-black",
			fill: "inherit",
			r: radius - BACKGROUND_CIRCLE_SPACING,
			strokeWidth: 0,
		}),
		[size], // eslint-disable-line react-hooks/exhaustive-deps
	);

	const normalizedData = useMemo(() => {
		let overflow = 0;
		let count = 0;

		const normalized: DonutGraphDataPoint[] = [];

		for (const entry of data) {
			if (entry.value < MIN_VALUE) {
				continue;
			}

			if (entry.value < MIN_DISPLAY_VALUE) {
				overflow = overflow + (MIN_DISPLAY_VALUE - entry.value);
				entry.value = MIN_DISPLAY_VALUE;
			} else if (entry.value > MIN_DISPLAY_VALUE * 1.25) {
				count++;
			}

			normalized.push(entry);
		}

		for (const entry of normalized) {
			if (entry.value > MIN_DISPLAY_VALUE * 1.25) {
				entry.value = entry.value - overflow / count;
			}
		}

		return normalized;
	}, [data]);

	const circles = useMemo<DonutGraphCircle[]>(() => {
		const items: DonutGraphCircle[] = [];

		// When there is only 1 segment avoid showing
		// the space between start and end of it.
		const spacing = normalizedData.length > 1 ? SEGMENT_SPACING : 0;

		let strokeDashoffset = (spacing / 2) * -1;
		let strokeDashoffsetHover = strokeDashoffset;

		for (const { color, value } of normalizedData) {
			const dash = (circumference * value) / 100;
			const dashHover = (circumferenceHover * value) / 100;

			const gap = (circumference * (100 - value)) / 100;
			const gapHover = (circumferenceHover * (100 - value)) / 100;

			// stroke-dashoffset has to be equal to the sum of the
			// lengths of the previous segments or they will overlap.
			strokeDashoffset += dash;
			strokeDashoffsetHover += dashHover;

			const strokeDasharray = [dash - spacing, gap + spacing].join(" ");
			const strokeDasharrayHover = [dashHover - spacing, gapHover + spacing].join(" ");

			items.push({
				animations: [
					{ attribute: "r", from: radius, to: radiusHover },
					{ attribute: "stroke-dasharray", from: strokeDasharray, to: strokeDasharrayHover },
					{ attribute: "stroke-dashoffset", from: strokeDashoffset, to: strokeDashoffsetHover },
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
	}, [circumference, normalizedData]); // eslint-disable-line react-hooks/exhaustive-deps

	return {
		backgroundCircle,
		circles,
	};
};

export { useDonutGraph };
