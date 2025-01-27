import { Icon } from "app/components/Icon";
import { Label } from "app/components/Label";
import { Tooltip } from "app/components/Tooltip";
import cn from "classnames";
import React from "react";

import { Amount } from "./Amount";

interface AmountLabelHintProperties {
	className: string;
	isCompact?: boolean;
	tooltipContent?: string;
}

const AmountLabelHint: React.VFC<AmountLabelHintProperties> = ({ className, isCompact, tooltipContent }) => (
	<Tooltip content={tooltipContent}>
		<div
			data-testid="AmountLabel__hint"
			className={cn(
				"flex items-center justify-center",
				className,
				isCompact ? "w-5 h-5 rounded-full" : "-ml-1.5 px-2",
			)}
		>
			<Icon name="HintSmall" size="sm" className="dark:text-white" />
		</div>
	</Tooltip>
);

interface AmountLabelProperties {
	isCompact?: boolean;
	isNegative: boolean;
	value: number;
	ticker: string;
	hint?: string;
}

export const AmountLabel: React.VFC<AmountLabelProperties> = ({ value, ticker, isCompact, isNegative, hint }) => {
	let labelColor = "success";
	let hintClassName = "bg-theme-success-200 dark:bg-theme-success-600";

	if (isNegative) {
		labelColor = "danger";
		hintClassName = "bg-theme-danger-100 dark:bg-theme-danger-400";
	}

	if (value === 0) {
		labelColor = "neutral";
		hintClassName = "";
	}

	return (
		<Label color={labelColor as any} noBorder={isCompact}>
			<div className={cn("flex space-x-1", isCompact ? "items-center" : "items-stretch")}>
				{hint && <AmountLabelHint tooltipContent={hint} className={hintClassName} isCompact={isCompact} />}
				<Amount showSign={value !== 0} ticker={ticker} value={value} isNegative={isNegative} />
			</div>
		</Label>
	);
};
