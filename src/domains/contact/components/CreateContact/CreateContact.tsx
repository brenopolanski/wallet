import { Contracts } from "@payvo/sdk-profiles";
import { Modal } from "app/components/Modal";
import { useEnvironmentContext } from "app/contexts";
import { ContactForm } from "domains/contact/components/ContactForm";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface CreateContactProperties {
	isOpen: boolean;
	profile: Contracts.IProfile;
	onClose?: any;
	onCancel?: any;
	onSave: any;
}

export const CreateContact = ({ isOpen, profile, onClose, onCancel, onSave }: CreateContactProperties) => {
	const { t } = useTranslation();
	const [errors, setErrors] = useState<any>({});

	const { persist } = useEnvironmentContext();

	useEffect(() => setErrors({}), [isOpen]);

	const handleOnSave = async ({ name, addresses }: any) => {
		const contact = profile.contacts().create(name, addresses);
		await persist();
		onSave?.(contact.id());
		setErrors({});
	};

	const handleChange = (fieldName: string) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { [fieldName]: _, ...restErrors } = errors;
		setErrors(restErrors);
	};

	return (
		<Modal
			title={t("CONTACTS.MODAL_CREATE_CONTACT.TITLE")}
			description={t("CONTACTS.MODAL_CREATE_CONTACT.DESCRIPTION")}
			isOpen={isOpen}
			onClose={onClose}
		>
			<div className="mt-8">
				<ContactForm
					profile={profile}
					onChange={handleChange}
					onCancel={onCancel}
					onSave={handleOnSave}
					errors={errors}
				/>
			</div>
		</Modal>
	);
};
