import tw from "twin.macro";
import { Size } from "types";

const baseStyle = tw`flex flex-col space-y-3 items-center justify-center transition-all duration-200 overflow-hidden`;

const getSize = (size?: Size) => {
	const sizes = {
		"2xs": () => tw`flex-shrink-0 h-8 w-8 rounded`,
		"3xs": () => tw`flex-shrink-0 h-6 w-6 rounded`,
		default: () => tw`flex-shrink-0 h-25 w-25 rounded-xl`,
		lg: () => tw`flex-shrink-0 h-32 w-32 rounded-xl`,
		sm: () => tw`flex-shrink-0 h-15 w-15 rounded-lg`,
		xl: () => tw`flex-shrink-0 h-44 w-44 rounded-2.5xl`,
		xs: () => tw`flex-shrink-0 h-11 w-11 rounded-lg`,
	};

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return (sizes[size as keyof typeof sizes] || sizes.default)();
};

const getVariant = (variant?: string) => {
	if (variant === "progress") {
		return tw`border border-theme-secondary-300 dark:border-theme-secondary-800 bg-theme-success-100 dark:bg-theme-success-900`;
	}
};

export const getStyles = ({ size, variant }: { size?: Size; variant?: string }) => [
	baseStyle,
	getSize(size),
	getVariant(variant),
];
