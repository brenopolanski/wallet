import { Contracts } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Form } from "app/components/Form";
import { ListDivided } from "app/components/ListDivided";
import { useEnvironmentContext } from "app/contexts";
import { useAccentColor, useTheme } from "app/hooks";
import { toasts } from "app/services";
import { useSettingsPrompt } from "domains/setting/hooks/use-settings-prompt";
import { AppearanceSettingsState } from "domains/setting/pages/Appearance/Appearance.contracts";
import { useAppearanceItems, useAppearanceSettings } from "domains/setting/pages/Appearance/Appearance.helpers";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Prompt } from "react-router-dom";

interface Properties {
	profile: Contracts.IProfile;
}

export const AppearanceForm: React.FC<Properties> = ({ profile }: Properties) => {
	const { t } = useTranslation();

	const { getValues, setValues } = useAppearanceSettings(profile);

	const items = useAppearanceItems();

	const form = useForm<AppearanceSettingsState>({
		defaultValues: getValues(),
		mode: "onChange",
	});

	const { formState, register, reset } = form;
	const { dirtyFields, isDirty, isSubmitting, isValid } = formState;

	const { persist } = useEnvironmentContext();
	const { getPromptMessage } = useSettingsPrompt({ dirtyFields, isDirty });

	const { setProfileTheme } = useTheme();
	const { setProfileAccentColor } = useAccentColor();

	useEffect(() => {
		register("accentColor", { required: true });
		register("viewingMode", { required: true });
	}, [register]);

	const save = async (values: AppearanceSettingsState) => {
		setValues(values);

		await persist();

		setProfileTheme(profile);
		setProfileAccentColor(profile);

		reset(getValues());

		toasts.success(t("SETTINGS.GENERAL.SUCCESS"));
		window.scrollTo({ behavior: "smooth", top: 0 });
	};

	return (
		<Form data-testid="AppearanceForm" context={form as any} onSubmit={save as any} className="mt-8">
			<ListDivided items={items} />

			<div className="flex justify-end mt-8 space-x-3 w-full">
				<Button
					data-testid="AppearanceFooterButtons__save"
					disabled={isSubmitting || isDirty ? !isValid : true}
					type="submit"
				>
					{t("COMMON.SAVE")}
				</Button>
			</div>

			<Prompt message={getPromptMessage} />
		</Form>
	);
};
