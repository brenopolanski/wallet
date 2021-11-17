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
					<div className="flex items-center space-x-1 text-sm font-semibold" key={index}>
						<span className={`h-3 w-1 rounded bg-theme-${color}`} />
						<span className="text-theme-secondary-700 dark:text-theme-secondary-200">{data.label}</span>
						<span className="text-theme-secondary-500 dark:text-theme-secondary-700">
							{data.percentFormatted}
						</span>
					</div>
				))}
			</div>
			<div className="border-l border-theme-secondary-300 dark:border-theme-secondary-800 ml-4 pl-4">
				<button
					disabled={hasZeroBalance}
					onClick={onMoreDetailsClick}
					type="button"
					className={cn(
						"font-semibold text-sm",
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
	<div className="flex flex-col font-semibold space-y-1 pl-3 first:pl-0">
		<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700 whitespace-nowrap">
			{label}
		</span>

		{children("text-lg text-theme-secondary-900 dark:text-theme-secondary-200")}
	</div>
);

const TooltipWrapper = styled.div`
	${tw`flex items-center bg-theme-secondary-900 dark:bg-theme-secondary-800 rounded px-3 py-2`}

	&:after {
		content: " ";
		${tw`absolute block w-0 h-0 -bottom-2`}
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-top: 8px solid var(--theme-color-secondary-900);
		left: calc(50% - 8px);
	}
`;

const Tooltip: React.VFC<TooltipProperties> = ({ dataPoint: { color, data } }) => (
	<TooltipWrapper>
		<div className="flex space-x-3 divide-x divide-theme-secondary-700 text-sm font-semibold">
			<div className="flex items-center space-x-2">
				<div className={`h-3 w-1 rounded bg-theme-${color}`} />
				<span className="text-white">{data.label}</span>
			</div>

			<span className="pl-3 text-theme-secondary-500">{data.amountFormatted}</span>

			<span className="pl-3 text-theme-secondary-500">{data.percentFormatted}</span>
		</div>
	</TooltipWrapper>
);

const PortfolioBreakdownSkeleton: React.VFC = () => {
	const { t } = useTranslation();

	const lineGraphSkeletonReference = useRef<HTMLDivElement | null>(null);

	return (
		<div className="py-4 px-6 bg-theme-secondary-100 dark:bg-black rounded-xl flex">
			<div className="flex space-x-3 divide-x divide-theme-secondary-300 dark:divide-theme-secondary-800">
				<LabelledText label={t("COMMON.YOUR_BALANCE")}>
					{() => (
						<div className="flex items-center h-7">
							<Skeleton height={18} width={100} />
						</div>
					)}
				</LabelledText>

				<LabelledText label={t("COMMON.ASSETS")}>
					{() => (
						<div className="flex items-center h-7">
							<Skeleton height={18} width={20} />
						</div>
					)}
				</LabelledText>

				<LabelledText label={t("COMMON.WALLETS")}>
					{() => (
						<div className="flex items-center h-7">
							<Skeleton height={18} width={20} />
						</div>
					)}
				</LabelledText>
			</div>

			<div className="flex-1 ml-4 self-end" ref={lineGraphSkeletonReference}>
				<Skeleton height={8} width={lineGraphSkeletonReference.current?.clientWidth ?? 0} />
			</div>
		</div>
	);
};

export { LabelledText, Legend, PortfolioBreakdownSkeleton, Tooltip };
