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

export { LabelledText, MoreDetailsButton };
