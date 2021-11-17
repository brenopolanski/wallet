import tw, { css } from "twin.macro";
import { ButtonVariant, Size } from "types";

const baseStyle = [
	tw`relative inline-flex items-center justify-center font-semibold leading-tight text-center transition-colors-shadow duration-100 ease-linear rounded outline-none`,
	tw`focus:(outline-none ring-2 ring-theme-primary-400)`,
	css`
		&:disabled {
			${tw`cursor-not-allowed`},
		}
	`,
];

const getVariant = (variant?: ButtonVariant, disabled?: boolean) => {
	if (disabled) {
		if (variant === "transparent") {
			return tw`disabled:(text-theme-secondary-400 dark:text-theme-secondary-700)`;
		}

		return tw`disabled:(bg-theme-secondary-200 text-theme-secondary-400 dark:bg-theme-secondary-800 dark:text-theme-secondary-700)`;
	}

	const variants = {
		danger: () => tw`
			bg-theme-danger-100 text-theme-danger-400
			hover:(bg-theme-danger-400 text-white dark:bg-theme-danger-500)
			dark:(bg-theme-danger-400 text-white)
			focus:ring-theme-danger-300
		`,
		default: () => tw`border-none`,
		info: () => tw`
			bg-theme-info-100 text-theme-info-600
			hover:(bg-theme-info-700 text-white)
			dark:(bg-theme-info-600 text-white)
			focus:ring-theme-info-300
		`,
		primary: () => tw`text-white bg-theme-primary-600 hover:bg-theme-primary-700`,
		reverse: () => tw`
			bg-theme-primary-reverse-100 text-theme-primary-reverse-600
			hover:(bg-theme-primary-reverse-700 text-white)
			dark:(bg-theme-primary-reverse-600 text-white)
			focus:ring-theme-primary-reverse-300
		`,
		secondary: () => tw`
			bg-theme-primary-100 text-theme-primary-600
			hover:(bg-theme-primary-700 text-white)
			dark:(bg-theme-secondary-800 text-theme-secondary-200)
		`,
		warning: () => tw`
			bg-theme-warning-100 text-theme-warning-700
			hover:(bg-theme-warning-700 text-white)
			dark:(bg-theme-warning-600 text-white)
			focus:ring-theme-warning-300
		`,
	};

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return (variants[variant as keyof typeof variants] || variants.default)();
};

const getSize = (size?: Size) => {
	const sizes = {
		default: () => tw`px-5 py-3 space-x-3 text-base`,
		icon: () => tw`p-3`,
		lg: () => tw`px-6 py-4 space-x-4`,
		sm: () => tw`px-3 py-2 space-x-2 text-sm`,
	};

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return (sizes[size as keyof typeof sizes] || sizes.default)();
};

export const getStyles = ({
	variant,
	size,
	disabled,
}: {
	variant?: ButtonVariant;
	size?: Size;
	disabled?: boolean;
}) => [getSize(size), baseStyle, getVariant(variant, disabled)];
