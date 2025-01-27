import { Button } from "app/components/Button";
import { Form, FormField, FormLabel } from "app/components/Form";
import { InputDefault } from "app/components/Input";
import { Modal } from "app/components/Modal";
import { Switch } from "app/components/Switch";
import { TextArea } from "app/components/TextArea";
import { useEnvironmentContext } from "app/contexts";
import { useValidation } from "app/hooks";
import { VerifyMessageStatus } from "domains/wallet/components/VerifyMessageStatus";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

enum VerificationMethod {
	Manual,
	Json,
}

interface Properties {
	isOpen: boolean;
	profileId: string;
	walletId: string;
	onSubmit?: any;
	onCancel?: any;
	onClose?: any;
}

const JsonForm = () => {
	const { t } = useTranslation();
	const jsonReference = useRef();

	const { register, unregister, setValue } = useFormContext();

	const { verifyMessage } = useValidation();

	useEffect(() => {
		register("jsonString", verifyMessage.jsonString());
	}, [register, verifyMessage]);

	useEffect(() => {
		unregister(["signatory", "message", "signature"]);
	}, [unregister]);

	return (
		<div data-testid="VerifyMessage__json" className="mt-4">
			<FormField name="jsonString">
				<FormLabel label={t("WALLETS.MODAL_VERIFY_MESSAGE.JSON_STRING")} />
				<TextArea
					data-testid="VerifyMessage__json-jsonString"
					className="py-4"
					initialHeight={90}
					placeholder={'{"signatory": "...", "signature": "...", "message": "..."}'}
					onChange={(event: ChangeEvent<HTMLInputElement>) =>
						setValue("jsonString", event.target.value, {
							shouldDirty: true,
							shouldValidate: true,
						})
					}
					ref={jsonReference}
				/>
			</FormField>
		</div>
	);
};

const ManualForm = () => {
	const { t } = useTranslation();

	const { register, unregister } = useFormContext();

	useEffect(() => {
		unregister("jsonString");
	}, [unregister]);

	return (
		<div data-testid="VerifyMessage__manual" className="mt-4 space-y-5">
			<FormField name="signatory">
				<FormLabel label={t("COMMON.PUBLIC_KEY")} />
				<InputDefault
					data-testid="VerifyMessage__manual-signatory"
					ref={register({
						required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
							field: t("COMMON.PUBLIC_KEY"),
						}).toString(),
					})}
				/>
			</FormField>

			<FormField name="message">
				<FormLabel label={t("COMMON.MESSAGE")} />
				<InputDefault
					data-testid="VerifyMessage__manual-message"
					ref={register({
						required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
							field: t("COMMON.MESSAGE"),
						}).toString(),
					})}
				/>
			</FormField>

			<FormField name="signature">
				<FormLabel label={t("COMMON.SIGNATURE")} />
				<InputDefault
					data-testid="VerifyMessage__manual-signature"
					ref={register({
						required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
							field: t("COMMON.SIGNATURE"),
						}).toString(),
					})}
				/>
			</FormField>
		</div>
	);
};

export const VerifyMessage = ({ profileId, walletId, onSubmit, onCancel, isOpen, onClose }: Properties) => {
	const { env } = useEnvironmentContext();

	const form = useForm({ mode: "onChange" });
	const { t } = useTranslation();

	const { getValues, formState } = form;
	const { isValid } = formState;

	const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>(VerificationMethod.Manual);
	const [isMessageVerified, setIsMessageVerified] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const isJson = verificationMethod === VerificationMethod.Json;

	const handleSubmit = async () => {
		const profile = env.profiles().findById(profileId);
		const wallet = profile.wallets().findById(walletId);

		try {
			const signedMessage = isJson
				? JSON.parse(getValues("jsonString"))
				: getValues(["signatory", "message", "signature"]);
			const isVerified = await wallet.message().verify(signedMessage);

			setIsSubmitted(true);
			setIsMessageVerified(isVerified);
			onSubmit?.(isVerified);
		} catch {
			setIsSubmitted(true);
			setIsMessageVerified(false);
			onSubmit?.(false);
		}
	};

	const statusKey = isMessageVerified ? "SUCCESS" : "ERROR";

	if (isSubmitted) {
		return (
			<VerifyMessageStatus
				title={t(`WALLETS.MODAL_VERIFY_MESSAGE.${statusKey}.TITLE`)}
				description={t(`WALLETS.MODAL_VERIFY_MESSAGE.${statusKey}.DESCRIPTION`)}
				type={isMessageVerified ? "success" : "error"}
				isOpen={isOpen}
				onClose={() => {
					setIsSubmitted(false);
					onClose?.();
				}}
			/>
		);
	}

	return (
		<Modal
			isOpen={isOpen}
			title={t("WALLETS.MODAL_VERIFY_MESSAGE.TITLE")}
			description={t("WALLETS.MODAL_VERIFY_MESSAGE.DESCRIPTION")}
			onClose={() => onClose?.()}
		>
			<div className="flex flex-col mt-8">
				<span className="block mb-1 text-lg font-semibold">
					{t("WALLETS.MODAL_VERIFY_MESSAGE.VERIFICATION_METHOD.TITLE")}
				</span>

				<span className="text-sm font-medium text-theme-secondary-500 dark:text-theme-secondary-700">
					{t("WALLETS.MODAL_VERIFY_MESSAGE.VERIFICATION_METHOD.DESCRIPTION")}
				</span>

				<Switch
					size="lg"
					className="mt-6"
					value={verificationMethod}
					onChange={setVerificationMethod}
					leftOption={{
						label: t("WALLETS.MODAL_VERIFY_MESSAGE.VERIFICATION_METHOD.JSON"),
						value: VerificationMethod.Json,
					}}
					rightOption={{
						label: t("WALLETS.MODAL_VERIFY_MESSAGE.VERIFICATION_METHOD.MANUAL"),
						value: VerificationMethod.Manual,
					}}
				/>

				<Form id="VerifyMessage__form" context={form} onSubmit={handleSubmit} className="space-y-6">
					{isJson ? <JsonForm /> : <ManualForm />}

					<div className="flex justify-end space-x-3">
						<Button variant="secondary" data-testid="VerifyMessage__cancel" onClick={onCancel}>
							{t("COMMON.CANCEL")}
						</Button>

						<Button data-testid="VerifyMessage__submit" type="submit" disabled={!isValid}>
							{t("WALLETS.MODAL_VERIFY_MESSAGE.VERIFY")}
						</Button>
					</div>
				</Form>
			</div>
		</Modal>
	);
};
