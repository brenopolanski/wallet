import { Tooltip } from "app/components/Tooltip";
import { useClipboard } from "app/hooks";
import React from "react";
import { useTranslation } from "react-i18next";

import { ClipboardIconProperties } from "./Clipboard.contracts";

export const ClipboardIcon = ({ data, tooltip, tooltipDarkTheme, options, children }: ClipboardIconProperties) => {
	const { t } = useTranslation();

	const [hasCopied, copy] = useClipboard({
		resetAfter: 1000,
		...options,
	});

	return (
		<Tooltip
			content={hasCopied ? t("COMMON.CLIPBOARD.SUCCESS") : tooltip || t("COMMON.CLIPBOARD.TOOLTIP_TEXT")}
			hideOnClick={false}
			theme={tooltipDarkTheme ? "dark" : undefined}
		>
			<button
				type="button"
				data-testid="clipboard-icon__wrapper"
				className="relative focus:outline-none ring-focus"
				onClick={() => copy(data)}
				data-ring-focus-margin="-m-1"
			>
				{children}
			</button>
		</Tooltip>
	);
};
