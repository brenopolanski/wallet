import React, { MouseEvent, MutableRefObject, useEffect, useRef, useState } from "react";

const GRAPH_COLORS = ["success-600", "warning-600", "info-600", "danger-400", "hint-400", "secondary-400"];
const GRAPH_COLORS_DARK = ["success-600", "warning-600", "info-600", "danger-400", "hint-400", "secondary-600"];

const GRAPH_COLOR_EMPTY = "secondary-300";
const GRAPH_COLOR_EMPTY_DARK = "secondary-800";

function useGraphWidth<TElement>(): [MutableRefObject<TElement | null>, number] {
	const reference = useRef<TElement | null>(null);

	const [value, setValue] = useState(0);

	useEffect(() => {
		const setWidth = () => {
			setValue((reference.current as HTMLElement | null)?.clientWidth ?? 0);
		};

		setWidth();

		window.addEventListener("resize", setWidth);

		return () => {
			window.removeEventListener("resize", setWidth);
		};
	});

	return [reference, value];
}

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

	const getMouseEventProperties = (dataPoint: TDataPoint) => ({
		onMouseMove: (event: MouseEvent<SVGElement>) => {
			const tooltipElement = tooltipReference.current as HTMLDivElement;

			setTooltipDataPoint(dataPoint);

			const targetRect = (event.target as SVGElement).getBoundingClientRect();

			if (type === "line") {
				tooltipElement.style.left = `${event.pageX - Math.floor(tooltipElement.clientWidth / 2)}px`;
				tooltipElement.style.top = `${targetRect.top - 48}px`;
			}

			if (type === "donut") {
				tooltipElement.style.left = `${event.pageX - targetRect.left - 32}px`;
				tooltipElement.style.top = `${event.pageY - targetRect.top - 24}px`;
			}

			window.clearTimeout(timeout.current);

			tooltipElement.classList.remove("hidden");
			tooltipElement.classList.remove("opacity-0");
			tooltipElement.classList.add("opacity-100");
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
		<div ref={tooltipReference} className="absolute duration-200 transition-opacity opacity-0">
			{!!tooltipDataPoint && renderFunction(tooltipDataPoint)}
		</div>
	);

	return { Tooltip, getMouseEventProperties };
}

export { GRAPH_COLOR_EMPTY, GRAPH_COLOR_EMPTY_DARK, GRAPH_COLORS, GRAPH_COLORS_DARK, useGraphTooltip, useGraphWidth };
