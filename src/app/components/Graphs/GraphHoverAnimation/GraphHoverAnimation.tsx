import React from "react";

import { GraphAnimation } from "./GraphHoverAnimation.contract";

interface GraphHoverAnimationProperties {
	animations: GraphAnimation[];
}

export const GraphHoverAnimation: React.VFC<GraphHoverAnimationProperties> = ({ animations }) => (
	<>
		{animations.map(({ attribute, from, to }, index) => (
			<React.Fragment key={index}>
				<animate attributeName={attribute} from={from} to={to} dur="0.1s" begin="mouseover" fill="freeze" />
				<animate attributeName={attribute} from={to} to={from} dur="0.15s" begin="mouseleave" fill="freeze" />
			</React.Fragment>
		))}
	</>
);
