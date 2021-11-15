import React, { MouseEvent, MutableRefObject, useEffect, useRef, useState } from "react";

const GRAPH_COLORS = ["success-600", "warning-600", "info-600", "danger-400", "hint-400", "secondary-400"];

const GRAPH_COLOR_EMPTY = "secondary-300";

const useGraphWidth = (reference: MutableRefObject<SVGSVGElement | null>): number => {
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

	return value;
};

interface UseGraphTooltipReturnType<TDataPoint, TSvgElement> {
	Tooltip: React.VFC;
	getMouseEventProperties: (
		dataPoint: TDataPoint,
	) => {
		onMouseMove: (event: MouseEvent<TSvgElement>) => void;
		onMouseOut: (event: MouseEvent<TSvgElement>) => void;
	};
}

function useGraphTooltip<TDataPoint, TSvgElement>(
	renderFunction?: (dataPoint: TDataPoint) => JSX.Element,
): UseGraphTooltipReturnType<TDataPoint, TSvgElement> {
	const tooltipReference = useRef<HTMLDivElement | null>(null);

	const [tooltipDataPoint, setTooltipDataPoint] = useState<TDataPoint | undefined>(undefined);

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

	const getMouseEventProperties = (dataPoint: TDataPoint) => ({
		onMouseMove: (event: MouseEvent<TSvgElement>) => {
			const tooltipElement = tooltipReference.current;

			if (!tooltipElement) {
				return;
			}

			const targetTop = (event.target as HTMLElement).getBoundingClientRect().top;

			if (!tooltipDataPoint) {
				setTooltipDataPoint(dataPoint);
			}

			tooltipElement.style.left = `${event.pageX - Math.floor(tooltipElement.clientWidth / 2)}px`;
			tooltipElement.style.top = `${targetTop - 48}px`;

			tooltipElement.classList.remove("opacity-0");
			tooltipElement.classList.add("opacity-100");
		},
		onMouseOut: () => {
			tooltipReference.current?.classList.add("opacity-0");
			tooltipReference.current?.classList.remove("opacity-100");
		},
	});

	return { Tooltip, getMouseEventProperties };
}

export { GRAPH_COLOR_EMPTY, GRAPH_COLORS, useGraphTooltip, useGraphWidth };
