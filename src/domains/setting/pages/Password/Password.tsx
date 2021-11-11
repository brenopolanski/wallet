import { Button } from "app/components/Button";
import { Form, FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { Icon } from "app/components/Icon";
import { InputPassword } from "app/components/Input";
import { useEnvironmentContext } from "app/contexts";
import { useActiveProfile, useValidation } from "app/hooks";
import { toasts } from "app/services";
import { PasswordRemovalConfirmModal } from "domains/setting/components/PasswordRemovalConfirmModal";
import { SettingsWrapper } from "domains/setting/components/SettingsPageWrapper";
import { useSettingsPrompt } from "domains/setting/hooks/use-settings-prompt";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Prompt } from "react-router-dom";

interface PasswordSettingsState {
	currentPassword: string;
	password: string;
	confirmPassword: string;
}

export const PasswordSettings = () => {
	const activeProfile = useActiveProfile();
	const { persist } = useEnvironmentContext();

	const usesPassword = activeProfile.usesPassword();
	const { password: passwordValidation } = useValidation();

	const [isConfirmRemovalVisible, setIsConfirmRemovalVisible] = useState(false);

	const { t } = useTranslation();

	const form = useForm<PasswordSettingsState>({
		defaultValues: {
			confirmPassword: "",
			currentPassword: "",
			password: "",
		},
		mode: "onChange",
	});

	const { formState, register, reset, trigger, watch } = form;
	const { currentPassword, confirmPassword, password } = watch();

	const { isDirty, dirtyFields, isSubmitting, isValid } = formState;
	const { getPromptMessage } = useSettingsPrompt({ dirtyFields, isDirty });

	useEffect(() => {
		if (confirmPassword) {
			trigger("confirmPassword");
		}
	}, [password, trigger]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSubmit: SubmitHandler<PasswordSettingsState> = async ({ currentPassword, password }) => {
		try {
			if (usesPassword) {
				activeProfile.auth().changePassword(currentPassword, password);
			} else {
				activeProfile.auth().setPassword(password);
			}
		} catch {
			toasts.error(t("SETTINGS.PASSWORD.ERROR.MISMATCH"));
			return;
		}

		reset();

		// the profile has already been saved by the changePassword / setPassword methods above
		await persist();

		toasts.success(t("SETTINGS.PASSWORD.SUCCESS"));
	};

	const handleRemoval = async (currentPassword: string): Promise<void> => {
		try {
			activeProfile.auth().forgetPassword(currentPassword);

			setIsConfirmRemovalVisible(false);

			reset();

			await persist();

			toasts.success(t("SETTINGS.PASSWORD.REMOVAL.SUCCESS"));
		} catch {
			toasts.error(t("SETTINGS.PASSWORD.ERROR.MISMATCH"));
		}
	};

	return (
		<>
			<SettingsWrapper profile={activeProfile} activeSettings="password">
				<Header
					title={t("SETTINGS.PASSWORD.TITLE")}
					subtitle={
						usesPassword ? t("SETTINGS.PASSWORD.SUBTITLE.UPDATE") : t("SETTINGS.PASSWORD.SUBTITLE.CREATE")
					}
				/>

				<Form
					id="password-settings__form"
					className="mt-8"
					context={form as any}
					onSubmit={handleSubmit as any}
				>
					<div className="space-y-5">
						{usesPassword && (
							<FormField name="currentPassword">
								<FormLabel label={t("SETTINGS.PASSWORD.CURRENT")} />
								<InputPassword
									ref={register({
										required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
											field: t("SETTINGS.PASSWORD.CURRENT"),
										}).toString(),
									})}
									data-testid="Password-settings__input--currentPassword"
								/>
							</FormField>
						)}

						<FormField name="password">
							<FormLabel label={t("SETTINGS.PASSWORD.PASSWORD_1")} />
							<InputPassword
								ref={register(passwordValidation.password(currentPassword))}
								data-testid={`Password-settings__input--password_1`}
							/>
						</FormField>

						<FormField name="confirmPassword">
							<FormLabel label={t("SETTINGS.PASSWORD.PASSWORD_2")} />
							<InputPassword
								ref={register(passwordValidation.confirmPassword(password))}
								data-testid={`Password-settings__input--password_2`}
							/>
						</FormField>
					</div>

					<div className="flex justify-end mt-8 w-full">
						{usesPassword && (
							<Button
								data-testid="Password-settings__remove-button"
								variant="danger"
								className="flex space-x-2 mr-auto"
								onClick={() => setIsConfirmRemovalVisible(true)}
							>
								<Icon name="Trash" />
								<span>{t("SETTINGS.PASSWORD.BUTTON.REMOVE")}</span>
							</Button>
						)}

						<Button
							data-testid="Password-settings__submit-button"
							disabled={isSubmitting || (isDirty ? !isValid : true)}
							type="submit"
						>
							{usesPassword ? t("SETTINGS.PASSWORD.BUTTON.UPDATE") : t("SETTINGS.PASSWORD.BUTTON.CREATE")}
						</Button>
					</div>
				</Form>

				<Prompt message={getPromptMessage} />
			</SettingsWrapper>

			{isConfirmRemovalVisible && (
				<PasswordRemovalConfirmModal
					onCancel={() => setIsConfirmRemovalVisible(false)}
					onConfirm={handleRemoval}
				/>
			)}
		</>
	);
};
