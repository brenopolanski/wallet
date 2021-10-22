import { Contracts } from "@payvo/profiles";
import { Coins, Enums, Networks } from "@payvo/sdk";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { Input, InputAddress, InputPassword } from "app/components/Input";
import { Select } from "app/components/SelectDropdown";
import { OptionsValue, useImportOptions } from "domains/wallet/hooks/use-import-options";
import { TFunction } from "i18next";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { assertNetwork, assertString } from "utils/assertions";

const validateAddress = async ({
	findAddress,
	optional,
	profile,
	t,
	value,
	network,
}: {
	findAddress: (value: string) => Promise<string>;
	optional: boolean;
	profile: Contracts.IProfile;
	t: TFunction;
	value: string;
	network: Networks.Network;
}) => {
	if (optional && !value) {
		return true;
	}

	try {
		const address = await findAddress(value);

		return (
			!profile.wallets().findByAddressWithNetwork(address, network.id()) ||
			t("COMMON.INPUT_PASSPHRASE.VALIDATION.ADDRESS_ALREADY_EXISTS", {
				address,
			}).toString()
		);
	} catch (error) {
		/* istanbul ignore next */
		return error.message;
	}
};

const MnemonicField = ({
	profile,
	label,
	findAddress,
	network,
	...properties
}: {
	profile: Contracts.IProfile;
	label: string;
	network: Networks.Network;
	findAddress: (value: string) => Promise<string>;
} & Omit<React.HTMLProps<any>, "ref">) => {
	const { t } = useTranslation();
	const { register } = useFormContext();

	return (
		<FormField name="value">
			<FormLabel label={label} />
			<InputPassword
				ref={register({
					required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
						field: label,
					}).toString(),
					validate: (value) =>
						validateAddress({
							findAddress,
							network,
							optional: false,
							profile,
							t,
							value,
						}),
				})}
				{...properties}
			/>
		</FormField>
	);
};

const AddressField = ({ coin, profile }: { coin: Coins.Coin; profile: Contracts.IProfile }) => {
	const { t } = useTranslation();
	const { register } = useFormContext();

	return (
		<FormField name="value">
			<FormLabel label={t("COMMON.ADDRESS")} />
			<InputAddress
				profile={profile}
				coin={coin.network().coin()}
				network={coin.network().id()}
				registerRef={register}
				additionalRules={{
					required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
						field: t("COMMON.ADDRESS"),
					}).toString(),
					validate: {
						duplicateAddress: (address) =>
							!profile.wallets().findByAddressWithNetwork(address, coin.network().id()) ||
							t("COMMON.INPUT_ADDRESS.VALIDATION.ADDRESS_ALREADY_EXISTS", { address }).toString(),
					},
				}}
				data-testid="ImportWallet__address-input"
			/>
		</FormField>
	);
};

const ImportInputField = ({ type, coin, profile }: { type: string; coin: Coins.Coin; profile: Contracts.IProfile }) => {
	const { t } = useTranslation();
	const { register, getValues, errors } = useFormContext();

	const network = getValues("network");
	assertNetwork(network);

	if (type.startsWith("bip")) {
		const findAddress = async (value: string) => {
			try {
				const { address } = await coin.address().fromMnemonic(value);
				return address;
			} catch {
				/* istanbul ignore next */
				throw new Error(t("WALLETS.PAGE_IMPORT_WALLET.VALIDATION.INVALID_MNEMONIC"));
			}
		};

		const allowsSecondSignature = network.allows(Enums.FeatureFlag.TransactionSecondSignature);

		return (
			<>
				<MnemonicField
					profile={profile}
					label={t(`COMMON.MNEMONIC_TYPE.${type.toUpperCase()}`)}
					data-testid="ImportWallet__mnemonic-input"
					findAddress={findAddress}
					network={network}
				/>

				{allowsSecondSignature && (
					<FormField name="secondMnemonic">
						<FormLabel label={t("COMMON.SECOND_MNEMONIC")} optional />

						<InputPassword
							disabled={!getValues("value") || errors.value}
							data-testid="ImportWallet__secondMnemonic-input"
							ref={register({
								validate: (value) =>
									validateAddress({
										findAddress,
										network,
										optional: true,
										profile,
										t,
										value,
									}),
							})}
						/>
					</FormField>
				)}
			</>
		);
	}

	if (type === OptionsValue.ADDRESS) {
		return <AddressField coin={coin} profile={profile} />;
	}

	if (type === OptionsValue.PUBLIC_KEY) {
		return (
			<MnemonicField
				profile={profile}
				label={t("COMMON.PUBLIC_KEY")}
				data-testid="ImportWallet__publicKey-input"
				findAddress={async (value) => {
					try {
						const { address } = await coin.address().fromPublicKey(value);
						return address;
					} catch {
						/* istanbul ignore next */
						throw new Error(t("WALLETS.PAGE_IMPORT_WALLET.VALIDATION.INVALID_PUBLIC_KEY"));
					}
				}}
				network={network}
			/>
		);
	}

	if (type === OptionsValue.PRIVATE_KEY) {
		return (
			<MnemonicField
				profile={profile}
				label={t("COMMON.PRIVATE_KEY")}
				data-testid="ImportWallet__privatekey-input"
				findAddress={async (value) => {
					try {
						const { address } = await coin.address().fromPrivateKey(value);
						return address;
					} catch {
						/* istanbul ignore next */
						throw new Error(t("WALLETS.PAGE_IMPORT_WALLET.VALIDATION.INVALID_PRIVATE_KEY"));
					}
				}}
				network={network}
			/>
		);
	}

	if (type === OptionsValue.WIF) {
		return (
			<MnemonicField
				profile={profile}
				label={t("COMMON.WIF")}
				data-testid="ImportWallet__wif-input"
				findAddress={async (value) => {
					try {
						const { address } = await coin.address().fromWIF(value);
						return address;
					} catch {
						/* istanbul ignore next */
						throw new Error(t("WALLETS.PAGE_IMPORT_WALLET.VALIDATION.INVALID_WIF"));
					}
				}}
				network={network}
			/>
		);
	}

	if (type === OptionsValue.ENCRYPTED_WIF) {
		return (
			<>
				<FormField name="encryptedWif">
					<FormLabel label={t("COMMON.ENCRYPTED_WIF")} />
					<div className="relative">
						<Input
							ref={register({
								required: t("COMMON.VALIDATION.FIELD_REQUIRED", {
									field: t("COMMON.ENCRYPTED_WIF"),
								}).toString(),
							})}
							data-testid="ImportWallet__encryptedWif-input"
						/>
					</div>
				</FormField>

				<MnemonicField
					profile={profile}
					label={t("COMMON.PASSWORD")}
					data-testid="ImportWallet__encryptedWif__password-input"
					findAddress={(value) => Promise.resolve(value)}
					network={network}
				/>
			</>
		);
	}

	if (type === OptionsValue.SECRET) {
		return (
			<MnemonicField
				profile={profile}
				label={t("COMMON.SECRET")}
				data-testid="ImportWallet__secret-input"
				findAddress={async (value) => {
					try {
						const { address } = await coin.address().fromSecret(value);
						return address;
					} catch {
						/* istanbul ignore next */
						throw new Error(t("WALLETS.PAGE_IMPORT_WALLET.VALIDATION.INVALID_SECRET"));
					}
				}}
				network={network}
			/>
		);
	}

	/* istanbul ignore next */
	throw new Error("Invalid import type. This looks like a bug.");
};

export const SecondStep = ({ profile }: { profile: Contracts.IProfile }) => {
	const { t } = useTranslation();
	const { getValues, watch, setValue, clearErrors } = useFormContext();

	const network = getValues("network");
	assertNetwork(network);

	const [coin] = useState(() => profile.coins().get(network.coin(), network.id()));

	const { options, defaultOption } = useImportOptions(network.importMethods());

	const type = watch("type", defaultOption);
	assertString(type);

	return (
		<section data-testid="ImportWallet__second-step">
			<Header
				title={t("WALLETS.PAGE_IMPORT_WALLET.METHOD_STEP.TITLE")}
				subtitle={t("WALLETS.PAGE_IMPORT_WALLET.METHOD_STEP.SUBTITLE")}
			/>

			<div className="mt-8 space-y-6">
				<FormField name="">
					<FormLabel>{t("WALLETS.PAGE_IMPORT_WALLET.METHOD_STEP.TYPE")}</FormLabel>
					<Select
						id="ImportWallet__select"
						data-testid="ImportWallet__type"
						defaultValue={type}
						options={options}
						onChange={(option: any) => {
							setValue("type", option?.value, { shouldDirty: true, shouldValidate: true });
							setValue("value", undefined);
							clearErrors("value");
						}}
					/>
				</FormField>

				<ImportInputField type={type} coin={coin} profile={profile} />
			</div>
		</section>
	);
};
