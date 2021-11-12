import { MutableRefObject, useEffect, useState } from "react";

export const GRAPH_COLORS = ["primary-600", "warning-600", "info-600", "danger-400", "hint-400", "secondary-400"];

export const useGraphWidth = (svgReference: MutableRefObject<SVGSVGElement | null>): number => {
	const [value, setValue] = useState(0);

	useEffect(() => {
		const setWidth = () => {
			setValue(svgReference.current?.clientWidth ?? 0);
		};

		setWidth();

		window.addEventListener("resize", setWidth);

		return () => {
			window.removeEventListener("resize", setWidth);
		};
	});

	return value;
};
