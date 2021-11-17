import tw from "twin.macro";
import { Position } from "types";

import { DropdownVariantType } from "./Dropdown.contracts";

export const defaultClasses = "mt-3 py-3 absolute z-10 bg-theme-background rounded-xl shadow-xl";

const getVariant = (variant: DropdownVariantType) => {
	if (variant === "options" || variant === "votesFilter") {
		return tw`dark:bg-theme-secondary-800`;
	}

	return tw`border-2 border-theme-primary-100 dark:border-theme-secondary-800`;
};

const getPosition = (position?: Position) => {
	const positions = {
		bottom: () => tw`bottom-0`,
		"bottom-left": () => tw`bottom-0 left-0`,
		default: () => tw`right-0`,
		left: () => tw`left-0`,
		top: () => tw`top-0`,
		"top-left": () => tw`top-0 left-0`,
		"top-right": () => tw`top-0 right-0`,
	};

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return (positions[position as keyof typeof positions] || positions.default)();
};

export const getStyles = ({ position, variant }: { position?: Position; variant: DropdownVariantType }) => [
	getVariant(variant),
	getPosition(position),
];
