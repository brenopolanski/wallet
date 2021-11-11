import React, { useEffect, useRef, useState } from "react";

import { LineGraphGraphConfig, LineGraphProperties } from "./LineGraph.contracts";

export function LineGraph<TDataType>({ data, mapper }: LineGraphProperties<TDataType>): JSX.Element {
	const reference = useRef<SVGSVGElement | null>(null);

	const [graphWidth, setGraphWidth] = useState<number>(0);

	const config: LineGraphGraphConfig = {
		graphWidth,
		segmentHeight: 8,
		segmentRadius: 4,
		segmentSpacing: 8,
	};

	useEffect(() => {
		if (!reference.current) {
			return;
		}

		setGraphWidth(reference.current.clientWidth);
	}, []);

	return (
		<svg ref={reference} className="w-full">
			{!!graphWidth &&
				mapper(data, config).map(({ width, x, color }, index) => (
					<rect
						x={x}
						y={0}
						key={index}
						className={`fill-current text-theme-${color}`}
						width={width}
						height={config.segmentHeight}
						rx={config.segmentRadius}
						ry={config.segmentRadius}
					/>
				))}
		</svg>
	);
}
