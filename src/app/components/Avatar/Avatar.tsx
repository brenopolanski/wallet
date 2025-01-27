import { Helpers } from "@payvo/sdk-profiles";
import cn from "classnames";
import React from "react";
import tw, { styled } from "twin.macro";
import { Size } from "types";

interface Properties {
	address?: string;
	className?: string;
	shadowClassName?: string;
	highlight?: boolean;
	noShadow?: boolean;
	size?: Size;
	children?: React.ReactNode;
}

const AvatarWrapper = styled.div<Properties>`
	${tw`transition-all duration-100 relative inline-flex items-center justify-center align-middle rounded-full`}

	${({ size }) => {
		const sizes = {
			default: () => tw`w-10 h-10`,
			lg: () => tw`w-11 h-11 text-sm`,
			sm: () => tw`w-8 h-8 text-sm`,
			xl: () => tw`w-16 h-16 text-xl`,
			xs: () => tw`w-5 h-5 text-sm`,
		};

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		return (sizes[size as keyof typeof sizes] || sizes.default)();
	}}

	${({ noShadow, shadowClassName }) => {
		if (noShadow) {
			return;
		}

		if (shadowClassName) {
			return tw`ring-6`;
		}

		return tw`ring-6 ring-theme-background`;
	}}
`;

export const Avatar = ({
	address = "",
	className,
	highlight,
	noShadow,
	shadowClassName,
	size,
	children,
}: Properties) => {
	const svg = React.useMemo(() => (address ? Helpers.Avatar.make(address) : undefined), [address]);

	return (
		<AvatarWrapper
			data-testid="Avatar"
			size={size}
			noShadow={!!noShadow}
			className={cn(className, shadowClassName, "flex-shrink-0")}
			shadowClassName={shadowClassName}
		>
			<div
				className={cn(
					"w-full h-full inline-flex items-center justify-center overflow-hidden align-middle rounded-full",
					{ "ring-2 ring-theme-primary-600": highlight },
				)}
			>
				{svg && <img alt={address} title={address} src={`data:image/svg+xml;utf8,${svg}`} />}
				{children}
			</div>
		</AvatarWrapper>
	);
};
