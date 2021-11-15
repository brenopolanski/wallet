import { Divider } from "app/components/Divider";
import { Skeleton } from "app/components/Skeleton";
import cn from "classnames";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import tw, { styled } from "twin.macro";

import type { LabelledTextProperties, LegendProperties, TooltipProperties } from "./PortfolioBreakdown.contracts";

const Legend: React.VFC<LegendProperties> = ({ hasZeroBalance, onMoreDetailsClick, dataPoints }) => {
	const { t } = useTranslation();

	return (
		<div className="flex justify-end mb-1">
			<div className="flex space-x-4">
				{dataPoints.map(({ color, data }, index) => (
					<div className="flex items-center space-x-1" key={index}>
						<div className={`h-3 w-1 rounded bg-theme-${color}`} />
						<div className="text-sm font-semibold text-theme-secondary-700 dark:text-theme-secondary-200">
							{data.label}
						</div>
						<div className="text-sm font-semibold text-theme-secondary-500 dark:text-theme-secondary-700">
							{data.percentFormatted}
						</div>
					</div>
				))}
			</div>
			<div className="border-l border-theme-secondary-300 dark:border-theme-secondary-800 ml-4 pl-4">
				<button
					disabled={hasZeroBalance}
					onClick={onMoreDetailsClick}
					type="button"
					className={cn(
						"font-semibold",
						hasZeroBalance
							? "cursor-not-allowed text-theme-secondary-500 dark:text-theme-secondary-700"
							: "link",
					)}
				>
					{t("COMMON.MORE_DETAILS")}
				</button>
			</div>
		</div>
	);
};

const LabelledText: React.FC<LabelledTextProperties> = ({ label, children }) => (
	<div className="flex flex-col font-semibold space-y-1 mx-2">
		<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700 whitespace-nowrap">
			{label}
		</span>

		{children("text-lg text-theme-secondary-900 dark:text-theme-secondary-200")}
	</div>
);

const TooltipWrapper = styled.div`
	${tw`flex items-center bg-theme-secondary-900 rounded px-3 py-2`}

	&:after {
		content: " ";
		${tw`absolute block w-0 h-0 -bottom-1`}
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-top: 8px solid var(--theme-color-secondary-900);
		left: calc(50% - 4px);
	}
`;

// @TODO improve dark mode styles
const Tooltip: React.VFC<TooltipProperties> = ({ dataPoint: { color, data } }) => (
	<TooltipWrapper>
		<div className={`h-3 w-1 rounded bg-theme-${color}`} />
		<div className="text-sm font-semibold text-white ml-1">{data.label}</div>

		<Divider type="vertical" />

		<div className="text-sm font-semibold text-theme-secondary-500">{data.amountFormatted}</div>

		<Divider type="vertical" />

		<div className="text-sm font-semibold text-theme-secondary-500">{data.percentFormatted}</div>
	</TooltipWrapper>
);

const PortfolioBreakdownSkeleton: React.VFC = () => {
	const { t } = useTranslation();

	const lineGraphSkeletonReference = useRef<HTMLDivElement | null>(null);

	return (
		<div className="py-4 px-6 bg-theme-secondary-100 rounded-xl flex">
			<LabelledText label={t("COMMON.YOUR_BALANCE")}>
				{() => <Skeleton className="mt-3" width={60} />}
			</LabelledText>

			<Divider size="xl" type="vertical" />

			<LabelledText label={t("COMMON.ASSETS")}>{() => <Skeleton className="mt-3" width={20} />}</LabelledText>

			<Divider size="xl" type="vertical" />

			<LabelledText label={t("COMMON.WALLETS")}>{() => <Skeleton className="mt-3" width={20} />}</LabelledText>

			<div className="flex-1 ml-4 self-end" ref={lineGraphSkeletonReference}>
				<Skeleton height={8} width={lineGraphSkeletonReference.current?.clientWidth ?? 0} />
			</div>
		</div>
	);
};

export { LabelledText, Legend, PortfolioBreakdownSkeleton, Tooltip };