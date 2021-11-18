import React, { MouseEvent, MutableRefObject, useCallback, useEffect, useRef, useState } from "react";

const GRAPH_COLORS = ["success-600", "warning-600", "info-600", "danger-400", "hint-400", "secondary-400"];
const GRAPH_COLORS_DARK = ["success-600", "warning-600", "info-600", "danger-400", "hint-400", "secondary-600"];

const GRAPH_COLOR_EMPTY = "secondary-300";
const GRAPH_COLOR_EMPTY_DARK = "secondary-800";

const useGraphWidth = (): [MutableRefObject<SVGSVGElement | null>, number] => {
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

interface UseGraphTooltipResult<TDataPoint> {
	Tooltip: React.VFC;
	getMouseEventProperties: (dataPoint: TDataPoint) => {
		onMouseMove: (event: MouseEvent<SVGElement>) => void;
		onMouseOut: (event: MouseEvent<SVGElement>) => void;
	};
}

function useGraphTooltip<TDataPoint>(
	renderFunction: ((dataPoint: TDataPoint) => JSX.Element) | undefined,
	type: "line" | "donut",
): UseGraphTooltipResult<TDataPoint> {
	const timeout = useRef<number>();
	const tooltipReference = useRef<HTMLDivElement | null>(null);

	const [tooltipDataPoint, setTooltipDataPoint] = useState<TDataPoint | undefined>(undefined);

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

	const getMouseEventProperties = (dataPoint: TDataPoint) => ({
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
}

export { GRAPH_COLOR_EMPTY, GRAPH_COLOR_EMPTY_DARK, GRAPH_COLORS, GRAPH_COLORS_DARK, useGraphTooltip, useGraphWidth };
