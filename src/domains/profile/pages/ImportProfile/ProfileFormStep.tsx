import { Contracts, Environment, Helpers } from "@payvo/sdk-profiles";
import { Button } from "app/components/Button";
import { Divider } from "app/components/Divider";
import { Form, FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { InputDefault, InputPassword } from "app/components/Input";
import { ListDivided } from "app/components/ListDivided";
import { Select } from "app/components/SelectDropdown";
import { SelectProfileImage } from "app/components/SelectProfileImage";
import { Toggle } from "app/components/Toggle";
import { useTheme, useValidation } from "app/hooks";
import { useCurrencyOptions } from "app/hooks/use-currency-options";
import { ReadableFile } from "app/hooks/use-files";
import { FilePreview } from "domains/profile/components/FilePreview";
import { DEFAULT_MARKET_PROVIDER } from "domains/profile/data";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { setThemeSource } from "utils/electron-utils";

interface CreateProfileFormProperties {
	file?: ReadableFile;
	profile: Contracts.IProfile;
	password?: string;
	env: Environment;
	shouldValidate: boolean;
	onSubmit: (profile: Contracts.IProfile) => void;
	onBack: () => void;
}

const CreateProfileForm = ({
	profile,
	env,
	password,
	onSubmit,
	onBack,
	shouldValidate,
}: CreateProfileFormProperties) => {
	const { t } = useTranslation();

	const currencyOptions = useCurrencyOptions(DEFAULT_MARKET_PROVIDER);

	const form = useForm<any>({
		defaultValues: {
			confirmPassword: password,
			currency: profile.settings().get(Contracts.ProfileSetting.ExchangeCurrency),
			isDarkMode: profile.settings().get(Contracts.ProfileSetting.Theme) === "dark",
			name: profile.name(),
			password,
		},
		mode: "onChange",
	});

	const { watch, register, formState, setValue, trigger, getValues } = form;
	const {
		confirmPassword,
		currency,
		isDarkMode,
		name,
		password: watchedPassword,
	} = watch(["confirmPassword", "currency", "isDarkMode", "name", "password"]);

	const [avatarImage, setAvatarImage] = useState(profile.avatar());

	const { theme, setTheme } = useTheme();
	const { createProfile, password: passwordValidation } = useValidation();

	const formattedName = name?.trim();

	const isSvg = useMemo(() => avatarImage.endsWith("</svg>"), [avatarImage]);

	useEffect(() => {
		if (shouldValidate) {
			trigger();
		}
	}, [shouldValidate, trigger]);

	useEffect(() => {
		if (!formattedName && isSvg) {
			setAvatarImage("");
		}
	}, [formattedName, isSvg, setAvatarImage]);

	useEffect(() => {
		if (getValues("confirmPassword")) {
			trigger("confirmPassword");
		}
	}, [watchedPassword, trigger, getValues]);

	useEffect(() => {
		const newTheme = isDarkMode ? "dark" : "light";

		document.body.classList.remove(`theme-${theme}`);
		document.body.classList.add(`theme-${newTheme}`);

		setThemeSource(newTheme);
	}, [isDarkMode, theme]);

	const otherItems = [
		{
			isFloatingLabel: true,
			label: t("SETTINGS.GENERAL.OTHER.DARK_THEME.TITLE"),
			labelAddon: <Toggle ref={register()} name="isDarkMode" />,
			labelClass: "text-xl font-semibold",
			labelDescription: t("SETTINGS.GENERAL.OTHER.DARK_THEME.DESCRIPTION"),
		},
	];

	const handleSubmit = async ({ name, password: enteredPassword, currency, isDarkMode }: any) => {
		if (!profile.name()) {
			profile.settings().set(Contracts.ProfileSetting.Name, name.trim());
			env.profiles().persist(profile);
		}

		env.profiles().push(profile);
		await env.profiles().restore(profile, password);

		profile.settings().set(Contracts.ProfileSetting.Name, name.trim());
		profile.settings().set(Contracts.ProfileSetting.Theme, isDarkMode ? "dark" : "light");
		profile.settings().set(Contracts.ProfileSetting.Avatar, avatarImage);
		profile.settings().set(Contracts.ProfileSetting.ExchangeCurrency, currency);

		if (enteredPassword || password) {
			profile.auth().setPassword(enteredPassword || password);
		}

		onSubmit(profile);
	};

	const showPasswordFields = !profile.usesPassword();

	return (
		<div>
			<Form context={form} onSubmit={handleSubmit} data-testid="CreateProfile__form">
				<div className="mt-2">
					<div className="relative mt-8 space-y-5">
						<div className="flex justify-between items-end -mt-4">
							<div className="mr-6 w-full">
								<FormField name="name">
									<FormLabel label={t("SETTINGS.GENERAL.PERSONAL.NAME")} />
									<InputDefault
										ref={register(createProfile.name())}
										onBlur={() => {
											/* istanbul ignore else */
											if (avatarImage.length === 0 || isSvg) {
												setAvatarImage(Helpers.Avatar.make(formattedName));
											}
										}}
									/>
								</FormField>
							</div>

							<SelectProfileImage
								value={avatarImage}
								name={formattedName}
								showLabel={false}
								onSelect={setAvatarImage}
							/>
						</div>

						{showPasswordFields && (
							<>
								<FormField name="password">
									<FormLabel
										label={t("SETTINGS.GENERAL.PERSONAL.PASSWORD")}
										optional={!watchedPassword && !confirmPassword}
									/>
									<InputPassword ref={register(passwordValidation.password())} />
								</FormField>

								<FormField name="confirmPassword">
									<FormLabel
										label={t("SETTINGS.GENERAL.PERSONAL.CONFIRM_PASSWORD")}
										optional={!watchedPassword && !confirmPassword}
									/>
									<InputPassword
										ref={register(passwordValidation.confirmOptionalPassword(watchedPassword))}
									/>
								</FormField>
							</>
						)}

						<FormField name="currency">
							<FormLabel label={t("SETTINGS.GENERAL.PERSONAL.CURRENCY")} />
							<Select
								id="CreateProfile__currency"
								defaultValue={currency}
								placeholder={t("COMMON.SELECT_OPTION", {
									option: t("SETTINGS.GENERAL.PERSONAL.CURRENCY"),
								})}
								ref={register(createProfile.currency())}
								options={currencyOptions}
								onChange={(currency: any) =>
									setValue("currency", currency?.value, {
										shouldDirty: true,
										shouldValidate: true,
									})
								}
							/>
						</FormField>
					</div>

					<div className="pb-4 mt-8">
						<ListDivided items={otherItems} />
					</div>
				</div>

				<Divider />

				<div className="flex justify-end pt-4 space-x-3">
					<Button
						variant="secondary"
						onClick={() => {
							onBack();
							// to prevent changing theme by component
							setTimeout(() => setTheme("system"), 0);
						}}
						data-testid="CreateProfile__back-button"
					>
						{t("COMMON.BACK")}
					</Button>

					<Button disabled={!formState.isValid} type="submit" data-testid="CreateProfile__submit-button">
						{t("COMMON.CREATE")}
					</Button>
				</div>
			</Form>
		</div>
	);
};

export const ImportProfileForm = ({
	profile,
	env,
	onSubmit,
	onBack,
	file,
	password,
	shouldValidate,
}: CreateProfileFormProperties) => {
	const { t } = useTranslation();

	return (
		<div className="mx-auto max-w-xl">
			<Header title={t("PROFILE.IMPORT.TITLE")} subtitle={t("PROFILE.IMPORT.FORM_STEP.DESCRIPTION")} />

			<div className="flex flex-col px-10 pt-8 pb-10 mt-10 rounded-lg border bg-theme-background border-theme-secondary-300 dark:border-theme-secondary-800">
				<div>
					<FilePreview file={file} variant="success" useBorders={false} />
				</div>

				<Divider />

				<CreateProfileForm
					shouldValidate={shouldValidate}
					profile={profile}
					env={env}
					onSubmit={onSubmit}
					onBack={onBack}
					password={password}
				/>
			</div>
		</div>
	);
};
