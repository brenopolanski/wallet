import React, { MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import {
	GraphDataPoint,
	MIN_DISPLAY_VALUE_DONUT,
	MIN_DISPLAY_VALUE_LINE,
	MIN_VALUE,
	UseGraphDataHook,
	UseGraphTooltipHook,
	UseGraphWidthHook,
} from "./Graphs.contracts";

const useGraphData: UseGraphDataHook = (graphType) => {
	const normalizeData = useCallback(
		(data: GraphDataPoint[]) => {
			let overflow = 0;
			let count = 0;

			const minValue = graphType === "line" ? MIN_DISPLAY_VALUE_LINE : MIN_DISPLAY_VALUE_DONUT;

			const normalized: GraphDataPoint[] = [];

			for (const entry of data) {
				if (entry.value < MIN_VALUE) {
					continue;
				}

				if (entry.value < minValue) {
					overflow = overflow + (minValue - entry.value);
					entry.value = minValue;
				} else if (entry.value > minValue * 1.25) {
					count++;
				}

				normalized.push(entry);
			}

			for (const entry of normalized) {
				if (entry.value > minValue * 1.25) {
					entry.value = entry.value - overflow / count;
				}
			}

			return normalized;
		},
		[graphType],
	);

	return { normalizeData };
};

const useGraphWidth: UseGraphWidthHook = () => {
	const reference = useRef<SVGSVGElement | null>(null);

	const [value, setValue] = useState(0);

	useEffect(() => {
		const setWidth = () => {
			setValue(reference.current?.clientWidth ?? 0);
		};

		setWidth();

		window.addEventListener("resize", setWidth);

		return () => {
			window.removeEventListener("resize", setWidth);
		};
	});

	return [reference, value];
};

const useGraphTooltip: UseGraphTooltipHook = (renderFunction, type) => {
	const timeout = useRef<number>();
	const tooltipReference = useRef<HTMLDivElement | null>(null);

	const [tooltipDataPoint, setTooltipDataPoint] = useState<GraphDataPoint | undefined>(undefined);

	const transformTooltip = useCallback(
		(event: MouseEvent<SVGElement>) => {
			const tooltipElement = tooltipReference.current as HTMLDivElement;
			const targetRect = (event.target as SVGElement).getBoundingClientRect();

			if (type === "line") {
				tooltipElement.style.left = `${event.pageX - Math.floor(tooltipElement.clientWidth / 2)}px`;
				tooltipElement.style.top = `${targetRect.top + document.documentElement.scrollTop - 48}px`;
			}

			if (type === "donut") {
				tooltipElement.style.left = `${event.pageX - targetRect.left - 32}px`;
				tooltipElement.style.top = `${
					event.pageY - targetRect.top - document.documentElement.scrollTop - 24
				}px`;
			}

			tooltipElement.classList.remove("hidden");
			tooltipElement.classList.remove("opacity-0");
			tooltipElement.classList.add("opacity-100");
		},
		[type],
	);

	const getMouseEventProperties = (dataPoint: GraphDataPoint) => ({
		onMouseEnter: (event: MouseEvent<SVGElement>) => {
			window.clearTimeout(timeout.current);

			setTooltipDataPoint(dataPoint);

			transformTooltip(event);
		},
		onMouseMove: (event: MouseEvent<SVGElement>) => {
			transformTooltip(event);
		},
		onMouseOut: () => {
			tooltipReference.current?.classList.add("opacity-0");
			tooltipReference.current?.classList.remove("opacity-100");

			timeout.current = window.setTimeout(() => {
				tooltipReference.current?.classList.add("hidden");
			}, 200);
		},
	});

	if (!renderFunction) {
		return {
			Tooltip: () => <></>,
			getMouseEventProperties: () => ({} as never),
		};
	}

	const Tooltip: React.VFC = () => (
		<div ref={tooltipReference} className="absolute z-10 duration-200 transition-opacity opacity-0">
			{!!tooltipDataPoint && renderFunction(tooltipDataPoint)}
		</div>
	);

	return { Tooltip, getMouseEventProperties };
};

export { useGraphData, useGraphTooltip, useGraphWidth };
