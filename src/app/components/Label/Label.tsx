import { styled } from "twin.macro";
import { Size } from "types";

import { ColorType, getStyles } from "./Label.styles";

export interface LabelProperties {
	color?: ColorType;
	size?: Size;
	variant?: "solid";
	noBorder?: boolean;
}

export const Label = styled.div.attrs<LabelProperties>(({ color }) => ({ color: color ?? "primary" }))<LabelProperties>(
	getStyles,
);
