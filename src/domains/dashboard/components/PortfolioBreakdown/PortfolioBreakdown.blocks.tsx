import { Divider } from "app/components/Divider";
import { useGraphFormatter } from "app/components/Graphs/Graphs.shared";
import { LineGraphDataPoint } from "app/components/Graphs/LineGraph/LineGraph.contracts";
import React from "react";
import { useTranslation } from "react-i18next";

interface MoreDetailsButtonProperties {
	onClick: () => void;
}

const MoreDetailsButton: React.VFC<MoreDetailsButtonProperties> = ({ onClick }) => {
	const { t } = useTranslation();

	return (
		<div className="border-l border-theme-secondary-300 dark:border-theme-secondary-800 ml-4 pl-4">
			<button onClick={onClick} type="button" className="font-semibold link">
				{t("COMMON.MORE_DETAILS")}
			</button>
		</div>
	);
};

interface LabelledTextProperties {
	label: string;
	children: (textClassName: string) => JSX.Element;
}

const LabelledText: React.FC<LabelledTextProperties> = ({ label, children }) => (
	<div className="flex flex-col font-semibold space-y-1 mx-2">
		<span className="text-sm text-theme-secondary-500 dark:text-theme-secondary-700">{label}</span>

		{children("text-lg text-theme-secondary-900 dark:text-theme-secondary-200")}
	</div>
);

interface TooltipProperties {
	dataPoint: LineGraphDataPoint;
}

const Tooltip: React.VFC<TooltipProperties> = ({ dataPoint: { color, label, percent, tooltipText } }) => {
	const { formatPercent } = useGraphFormatter();

	// @TODO improve dark mode styles

	return (
		<div className="flex items-center bg-theme-secondary-900 rounded px-3 py-2">
			<div className={`h-3 w-1 rounded bg-theme-${color}`} />
			<div className="text-sm font-semibold text-white ml-1">{label}</div>

			<Divider type="vertical" />

			<div className="text-sm font-semibold text-theme-secondary-500">{tooltipText}</div>

			<Divider type="vertical" />

			<div className="text-sm font-semibold text-theme-secondary-500">{formatPercent(percent)}</div>
		</div>
	);
};

export { LabelledText, MoreDetailsButton, Tooltip };
