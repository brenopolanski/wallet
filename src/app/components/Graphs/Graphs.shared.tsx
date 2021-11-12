import React, { MouseEvent, MutableRefObject, useEffect, useRef, useState } from "react";

const GRAPH_COLORS = ["success-600", "warning-600", "info-600", "danger-400", "hint-400", "secondary-400"];

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

const useGraphFormatter = (): { formatPercent: (value: number) => string } => ({
	formatPercent: (value: number): string => `${Math.round((value + Number.EPSILON) * 100) / 100}%`,
});

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

	const Tooltip: React.VFC = () => (
		<div ref={tooltipReference} className="absolute hidden">
			{!!tooltipDataPoint && renderFunction?.(tooltipDataPoint)}
		</div>
	);

	const getMouseEventProperties = (dataPoint: TDataPoint) => ({
		onMouseMove: (event: MouseEvent<TSvgElement>) => {
			const tooltipElement = tooltipReference.current;

			if (!tooltipElement) {
				return;
			}

			if (!tooltipDataPoint) {
				setTooltipDataPoint(dataPoint);
			}

			tooltipElement.style.left = `${event.pageX - Math.floor(tooltipElement.clientWidth / 2)}px`;
			tooltipElement.style.top = `${event.pageY - 48}px`;

			tooltipElement.classList.remove("hidden");
		},
		onMouseOut: () => {
			setTooltipDataPoint(undefined);
			tooltipReference.current?.classList.add("hidden");
		},
	});

	return { Tooltip, getMouseEventProperties };
}

export { GRAPH_COLORS, useGraphFormatter, useGraphTooltip, useGraphWidth };
