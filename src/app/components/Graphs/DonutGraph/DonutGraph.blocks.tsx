import React, { useEffect, useRef } from "react";

interface ContentInsideCircleProperties {
	renderFunction: (() => JSX.Element) | undefined;
	size: number;
}

export const ContentInsideCircle: React.VFC<ContentInsideCircleProperties> = ({ renderFunction, size }) => {
	const reference = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const container = reference.current;

		if (!container) {
			return;
		}

		const containerRect = container.getBoundingClientRect();

		container.style.left = `${Math.floor(size / 2 - containerRect.width / 2)}px`;
		container.style.top = `${Math.floor(size / 2 - containerRect.height / 2)}px`;
	}, [size]);

	if (!renderFunction) {
		return <></>;
	}

	return (
		<div className="absolute" ref={reference}>
			{renderFunction()}
		</div>
	);
};
