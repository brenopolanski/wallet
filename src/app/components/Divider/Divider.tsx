import { styled } from "twin.macro";

import { getStyles } from "./Divider.styles";

interface DividerProperties {
	type?: "horizontal" | "vertical";
	size?: "sm" | "md" | "lg" | "xl";
	dashed?: boolean;
	className?: string;
}

export const Divider = styled.div.attrs<DividerProperties>(({ className, type }) => ({
	className: className ? undefined : "border-theme-secondary-300 dark:border-theme-secondary-800",
	type: type ?? "horizontal",
}))<DividerProperties>(getStyles);
