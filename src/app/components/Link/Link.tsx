import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import { toasts } from "app/services";
import cn from "classnames";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, LinkProps } from "react-router-dom";
import tw, { styled } from "twin.macro";
import { openExternal } from "utils/electron-utils";

const AnchorStyled = styled.a(() => [
	tw`relative inline-block space-x-2 font-semibold text-theme-primary-600`,
	tw`transition-colors`,
	tw`cursor-pointer no-underline`,
	tw`hover:text-theme-primary-700`,
	tw`active:text-theme-primary-400`,
	tw`focus:outline-none`,
]);

const Content = styled.span(() => [
	tw`break-all border-b border-transparent group-hover:border-current`,
	tw`transition-property[color, border-color]`,
	tw`transition-duration[200ms, 350ms]`,
	tw`transition-delay[0s, 100ms]`,
]);

type AnchorProperties = {
	isExternal?: boolean;
	navigate?: () => void;
	showExternalIcon?: boolean;
} & React.AnchorHTMLAttributes<any>;

const Anchor = React.forwardRef<HTMLAnchorElement, AnchorProperties>(
	({ isExternal, showExternalIcon, href, children, rel, ...properties }: AnchorProperties, reference) => (
		<AnchorStyled
			className="group ring-focus"
			data-testid="Link"
			rel={isExternal ? "noopener noreferrer" : rel}
			ref={reference}
			onClick={(event) => {
				event.stopPropagation();
				event.preventDefault();
				return properties.navigate?.();
			}}
			href={href || "#"}
			data-ring-focus-margin="-m-1"
			{...properties}
		>
			<Content>{children}</Content>
			{isExternal && showExternalIcon && (
				<Icon
					data-testid="Link__external"
					name="ArrowExternal"
					className={cn("flex-shrink-0 duration-200", { "inline-block text-sm": children })}
				/>
			)}
		</AnchorStyled>
	),
);

Anchor.displayName = "Anchor";

type Properties = {
	isExternal?: boolean;
	children?: React.ReactNode;
	tooltip?: string;
	showExternalIcon?: boolean;
} & Omit<LinkProps, "referrerPolicy">;

export const Link = ({ tooltip, isExternal = false, showExternalIcon = true, ...properties }: Properties) => {
	const { t } = useTranslation();

	return (
		<Tooltip content={tooltip} disabled={!tooltip}>
			{isExternal ? (
				<Anchor
					onClick={(event) => {
						event.stopPropagation();
						event.preventDefault();
						try {
							openExternal(properties.to);
						} catch {
							toasts.error(t("COMMON.ERRORS.INVALID_URL", { url: properties.to }));
						}
					}}
					isExternal={isExternal}
					showExternalIcon={showExternalIcon}
					{...properties}
				/>
			) : (
				<RouterLink component={Anchor} {...properties} />
			)}
		</Tooltip>
	);
};
