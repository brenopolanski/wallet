import { Contracts, Environment } from "@payvo/sdk-profiles";
import { Header } from "app/components/Header";
import { ReadableFile } from "app/hooks/use-files";
import { FilePreview } from "domains/profile/components/FilePreview";
import { PasswordModal } from "domains/profile/components/PasswordModal";
import { useProfileImport } from "domains/profile/hooks/use-profile-import";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ProcessingImportProperties {
	env: Environment;
	file: ReadableFile;
	password?: string;
	onSuccess?: (profile: any) => void;
	onBack?: () => void;
	onPasswordChange?: (password?: string) => void;
	onError?: (message: string) => void;
	shouldRequestPassword?: boolean;
}

export const ProcessingImport = ({
	file,
	env,
	onError,
	onBack,
	onPasswordChange,
	password,
	onSuccess,
	shouldRequestPassword = false,
}: ProcessingImportProperties) => {
	const { t } = useTranslation();
	const { importProfile } = useProfileImport({ env });
	const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(shouldRequestPassword);
	const [passwordError, setPasswordError] = useState<string>();

	useEffect(() => {
		const runImport = async () => {
			let profile: Contracts.IProfile | undefined;

			try {
				profile = await importProfile({ file, password });

				if (isPasswordModalOpen) {
					setIsPasswordModalOpen(false);
				}

				onSuccess?.(profile);
			} catch (error) {
				if (error.message === "PasswordRequired") {
					setIsPasswordModalOpen(true);
					return;
				}

				if (error.message === "InvalidPassword") {
					setIsPasswordModalOpen(true);
					setPasswordError(t("COMMON.VALIDATION.FIELD_INVALID", { field: t("COMMON.PASSWORD") }));
					return;
				}

				onError?.(error.message);
			}
		};

		if (file) {
			runImport();
		}
	}, [file, env, password]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="mx-auto max-w-xl" data-testid="ProcessingImport">
			<Header
				title={t("PROFILE.IMPORT.TITLE")}
				subtitle={t("PROFILE.IMPORT.PROCESSING_IMPORT_STEP.DESCRIPTION", { name: file?.name || "" })}
			/>
			<div className="text-theme-secondary-text">{t("PROFILE.IMPORT.PROCESSING_IMPORT_STEP.PLEASE_WAIT")}</div>

			<div className="mt-8">
				<FilePreview file={file} variant="loading" />
			</div>

			<div className="text-left items-left">
				<PasswordModal
					error={passwordError}
					isOpen={isPasswordModalOpen}
					title={t("PROFILE.IMPORT.PASSWORD_TITLE")}
					description={t("PROFILE.IMPORT.PASSWORD_DESCRIPTION")}
					onSubmit={(enteredPassword) => {
						setPasswordError(undefined);
						onPasswordChange?.(enteredPassword);
					}}
					onClose={() => {
						setPasswordError(undefined);
						setIsPasswordModalOpen(false);
						onPasswordChange?.(undefined);
						onBack?.();
					}}
				/>
			</div>
		</div>
	);
};
