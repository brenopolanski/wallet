import { Coins, Networks } from "@payvo/sdk";
import { Contracts } from "@payvo/sdk-profiles";
import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { Form, FormField, FormLabel, SubForm } from "app/components/Form";
import { Icon } from "app/components/Icon";
import { InputAddress, InputDefault } from "app/components/Input";
import { OptionProperties, Select } from "app/components/SelectDropdown";
import { Tooltip } from "app/components/Tooltip";
import { useEnvironmentContext } from "app/contexts";
import { useNetworkOptions } from "app/hooks";
import { contactForm } from "domains/contact/validations/ContactForm";
import { NetworkIcon } from "domains/network/components/NetworkIcon";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface AddressListItemProperties {
	address: any;
	onRemove: any;
}

interface NetworkOption {
	label: string;
	value: string;
	isTestNetwork?: boolean;
}

const AddressListItem = ({ address, onRemove }: AddressListItemProperties) => {
	const { env } = useEnvironmentContext();

	const network = useMemo(
		() =>
			env
				.availableNetworks()
				.find(
					(network: Networks.Network) => network.coin() === address.coin && network.id() === address.network,
				),
		[address, env],
	);

	return (
		<div
			data-testid="contact-form__address-list-item"
			className="flex items-center py-4 border-b border-dashed last:pb-0 last:border-b-0 border-theme-secondary-300 dark:border-theme-secondary-800"
		>
			<div className="mr-4">
				<div className="flex items-center -space-x-1">
					<NetworkIcon network={network} size="lg" />
					<Avatar address={address.address} size="lg" />
				</div>
			</div>

			<span className="font-semibold">
				<Address address={address.address} />
			</span>

			<Button
				data-testid="contact-form__remove-address-btn"
				size="icon"
				className="flex items-center ml-auto"
				variant="danger"
				onClick={() => onRemove(address)}
			>
				<Icon name="Trash" />
			</Button>
		</div>
	);
};

interface AddressListProperties {
	addresses: any[];
	onRemove: any;
}

const AddressList = ({ addresses, onRemove }: AddressListProperties) => {
	const { t } = useTranslation();

	return (
		<div className="group">
			<span className="inline-block text-sm font-semibold transition-colors duration-100 text-theme-secondary-text group-hover:text-theme-primary-600">
				{t("CONTACTS.CONTACT_FORM.ADDRESSES")}
			</span>

			<div data-testid="contact-form__address-list">
				{addresses.map((address: any, index: number) => (
					<AddressListItem key={index} address={address} onRemove={onRemove} />
				))}
			</div>
		</div>
	);
};

interface ContactFormProperties {
	contact?: Contracts.IContact;
	profile: Contracts.IProfile;
	onCancel?: any;
	onChange?: any;
	onDelete?: any;
	onSave: any;
	errors?: any;
}

const defaultProps = {
	errors: {},
};

export const ContactForm = ({
	profile,
	contact,
	onChange,
	onCancel,
	onDelete,
	onSave,
	errors = defaultProps.errors,
}: ContactFormProperties) => {
	const [addresses, setAddresses] = useState(() =>
		contact
			? contact
					.addresses()
					.values()
					.map((address: Contracts.IContactAddress) => ({
						address: address.address(),
						coin: address.coin(),
						name: contact.name(),
						network: address.network(),
					}))
			: [],
	);

	const { t } = useTranslation();

	const form = useForm({ mode: "onChange" });
	const { formState, register, setError, setValue, watch, trigger } = form;
	const { isValid } = formState;

	const { name, network, address } = watch();

	const contactFormValidation = contactForm(t, profile);

	useEffect(() => {
		register({ name: "network" });
	}, [register]);

	useEffect(() => {
		for (const [field, message] of Object.entries(errors)) {
			setError(field, { message: message as string, type: "manual" });
		}
	}, [errors, setError]);

	const { networkOptions, networkById } = useNetworkOptions(
		profile.settings().get(Contracts.ProfileSetting.UseTestNetworks),
	);

	const filteredNetworks = useMemo(() => {
		const usedNetworks = new Set(addresses.map((address: any) => address.network));
		return networkOptions.filter(({ value }: NetworkOption) => !usedNetworks.has(value));
	}, [addresses, networkOptions]);

	const handleAddAddress = async () => {
		const instance: Coins.Coin = profile.coins().set(network.coin(), network.id());
		await instance.__construct();
		const isValidAddress: boolean = await instance.address().validate(address);

		if (!isValidAddress) {
			return setError("address", { message: t("CONTACTS.VALIDATION.ADDRESS_IS_INVALID"), type: "manual" });
		}

		const duplicateAddress = profile.contacts().findByAddress(address);

		if (duplicateAddress.length > 0) {
			return setError("address", { message: t("CONTACTS.VALIDATION.CONTACT_ADDRESS_EXISTS"), type: "manual" });
		}

		setAddresses(
			addresses.concat({
				address,
				coin: network.coin(),
				name: address,
				network: network.id(),
			}),
		);

		setValue("network", null);
		setValue("address", null);
	};

	const handleRemoveAddress = (item: any) => {
		setAddresses(
			addresses.filter((current: any) => !(current.address === item.address && current.network === item.network)),
		);
	};

	const handleSelectNetwork = (networkOption?: NetworkOption) => {
		setValue("network", networkById(networkOption?.value), { shouldDirty: true, shouldValidate: true });
		trigger("address");
	};

	const renderNetworkLabel = (option: OptionProperties) => (
		<div className="flex justify-between">
			<span>{option.label}</span>
			{!!(option as NetworkOption).isTestNetwork && (
				<Tooltip content={t("COMMON.TEST_NETWORK")}>
					<span>
						<Icon
							className="text-theme-secondary-500 dark:text-theme-secondary-700"
							name="Code"
							size="lg"
						/>
					</span>
				</Tooltip>
			)}
		</div>
	);

	return (
		<Form
			data-testid="contact-form"
			context={form}
			onSubmit={() =>
				onSave({
					addresses,
					name,
				})
			}
		>
			<FormField name="name">
				<FormLabel>{t("CONTACTS.CONTACT_FORM.NAME")}</FormLabel>
				<InputDefault
					data-testid="contact-form__name-input"
					ref={register(contactFormValidation.name(contact?.id()))}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						onChange?.("name", event.target.value);
					}}
					defaultValue={contact?.name?.()}
				/>
			</FormField>

			<SubForm>
				<FormField name="network">
					<FormLabel>{t("CONTACTS.CONTACT_FORM.CRYPTOASSET")}</FormLabel>
					<Select
						placeholder={t("COMMON.INPUT_NETWORK.PLACEHOLDER")}
						defaultValue={network?.id()}
						options={filteredNetworks}
						onChange={(networkOption: any) => handleSelectNetwork(networkOption)}
						renderLabel={renderNetworkLabel}
					/>
				</FormField>

				<FormField name="address" data-testid="ContactForm__address">
					<FormLabel>{t("CONTACTS.CONTACT_FORM.ADDRESS")}</FormLabel>

					<InputAddress
						profile={profile}
						useDefaultRules={false}
						registerRef={register}
						onChange={() => onChange?.("address", address)}
						data-testid="contact-form__address-input"
					/>
				</FormField>

				<div className="mt-4">
					<Button
						data-testid="contact-form__add-address-btn"
						variant="secondary"
						className="w-full"
						disabled={!network || !address}
						onClick={handleAddAddress}
					>
						{t("CONTACTS.CONTACT_FORM.ADD_ADDRESS")}
					</Button>
				</div>
			</SubForm>

			{addresses && addresses.length > 0 && <AddressList addresses={addresses} onRemove={handleRemoveAddress} />}

			<div
				className={`flex w-full pt-8 border-t border-theme-secondary-300 dark:border-theme-secondary-800 ${
					contact ? "justify-between" : "justify-end"
				}`}
			>
				{contact && (
					<Button data-testid="contact-form__delete-btn" onClick={onDelete} variant="danger">
						<Icon name="Trash" />
						<span>{t("CONTACTS.CONTACT_FORM.DELETE_CONTACT")}</span>
					</Button>
				)}

				<div className="space-x-3">
					<Button data-testid="contact-form__cancel-btn" variant="secondary" onClick={onCancel}>
						{t("COMMON.CANCEL")}
					</Button>

					<Button
						data-testid="contact-form__save-btn"
						type="submit"
						variant="primary"
						disabled={addresses.length === 0 || !isValid}
					>
						{t("COMMON.SAVE")}
					</Button>
				</div>
			</div>
		</Form>
	);
};
