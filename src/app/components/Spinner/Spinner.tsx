import { styled } from "twin.macro";
import { Color, Size } from "types";

import { getStyles } from "./Spinner.styles";

interface SpinnerType {
	color?: Color;
	size?: Size;
}

export const Spinner = styled.div<SpinnerType>(getStyles);

Spinner.defaultProps = {
	color: "info",
};
