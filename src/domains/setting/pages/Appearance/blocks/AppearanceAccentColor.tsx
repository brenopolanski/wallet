import { ButtonGroup, ButtonGroupOption } from "app/components/ButtonGroup";
import { AppearanceSettingsState } from "domains/setting/pages/Appearance/Appearance.contracts";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface AccentColorItem {
	className: string;
	key: string;
	tooltipContent: string;
}

export const AppearanceAccentColor: React.FC = () => {
	const { t } = useTranslation();

	const form = useFormContext<AppearanceSettingsState>();

	const accentColor = form.watch("accentColor");

	const colors: AccentColorItem[] = [
		{
			className: "bg-theme-info-600",
			key: "blue",
			tooltipContent: t("SETTINGS.APPEARANCE.OPTIONS.ACCENT_COLOR.COLORS.BLUE"),
		},
		{
			className: "bg-theme-success-600",
			key: "green",
			tooltipContent: t("SETTINGS.APPEARANCE.OPTIONS.ACCENT_COLOR.COLORS.GREEN"),
		},
	];

	return (
		<ButtonGroup>
			{colors.map(({ className, key, tooltipContent }) => (
				<ButtonGroupOption
					tooltipContent={tooltipContent}
					isSelected={() => accentColor === key}
					key={key}
					setSelectedValue={() =>
						form.setValue("accentColor", key, {
							shouldDirty: true,
							shouldValidate: true,
						})
					}
					value={key}
					variant="modern"
				>
					<div className={`w-5 h-5 mx-1 rounded ${className}`} />
				</ButtonGroupOption>
			))}
		</ButtonGroup>
	);
};
