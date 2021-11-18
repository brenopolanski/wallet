import { Networks } from "@payvo/sdk";
import { Contracts } from "@payvo/sdk-profiles";
import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Circle } from "app/components/Circle";
import { useFormField } from "app/components/Form/useFormField";
import { Icon } from "app/components/Icon";
import { Select } from "app/components/SelectDropdown";
import { TruncateEnd } from "app/components/TruncateEnd";
import { useWalletAlias, WalletAliasResult } from "app/hooks/use-wallet-alias";
import cn from "classnames";
import { AddressProperties, useProfileAddresses } from "domains/profile/hooks/use-profile-addresses";
import { SearchRecipient } from "domains/transaction/components/SearchRecipient";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type SelectRecipientProperties = {
	network?: Networks.Network;
	address?: string;
	profile: Contracts.IProfile;
	disabled?: boolean;
	isInvalid?: boolean;
	showOptions?: boolean;
	contactSearchTitle?: string;
	contactSearchDescription?: string;
	placeholder?: string;
	exceptMultiSignature?: boolean;
	onChange?: (address: string | undefined, alias: WalletAliasResult) => void;
} & Omit<React.InputHTMLAttributes<any>, "onChange">;

const ProfileAvatar = ({ address }: any) => {
	if (!address) {
		return (
			<Circle
				className="bg-theme-secondary-200 border-theme-secondary-200 dark:bg-theme-secondary-700 dark:border-theme-secondary-700"
				size="sm"
				noShadow
			/>
		);
	}
	return <Avatar address={address} size="sm" noShadow />;
};

const OptionLabel = ({
	option,
	network,
	profile,
}: {
	option: any;
	network?: Networks.Network;
	profile: Contracts.IProfile;
}) => {
	const address = option.value;

	const { getWalletAlias } = useWalletAlias();

	const { alias } = useMemo(
		() =>
			getWalletAlias({
				address,
				network,
				profile,
			}),
		[address, getWalletAlias, network, profile],
	);

	return (
		<div className="flex items-center space-x-2 whitespace-nowrap">
			<Avatar size="sm" address={address} className="flex-shrink-0" noShadow />
			<Address
				address={address}
				walletName={alias}
				addressClass={cn({ "text-theme-primary-600": !alias && option.isSelected })}
				walletNameClass={cn({ "text-theme-primary-600": option.isSelected })}
			/>
		</div>
	);
};

export const SelectRecipient = React.forwardRef<HTMLInputElement, SelectRecipientProperties>(
	(
		{
			address,
			profile,
			disabled,
			isInvalid,
			showOptions = true,
			network,
			placeholder,
			exceptMultiSignature,
			onChange,
		}: SelectRecipientProperties,
		reference,
	) => {
		const { getWalletAlias } = useWalletAlias();

		const [isRecipientSearchOpen, setIsRecipientSearchOpen] = useState(false);

		/*
		 * Initial value for selected address is set in useEffect below via onChangeAddress.
		 * This is made to also retrieve alias information of the selected address.
		 */
		const [selectedAddress, setSelectedAddress] = useState<string | undefined>();
		const [selectedAddressAlias, setSelectedAddressAlias] = useState<WalletAliasResult | undefined>();

		const fieldContext = useFormField();

		const onChangeAddress = useCallback(
			(addressValue: string | undefined, emitOnChange = true) => {
				if (addressValue === selectedAddress) {
					return;
				}

				const alias = getWalletAlias({
					address: addressValue,
					network,
					profile,
				});

				setSelectedAddress(addressValue);
				setSelectedAddressAlias(alias);

				if (emitOnChange) {
					onChange?.(addressValue, alias);
				}
			},
			[getWalletAlias, network, onChange, profile, selectedAddress],
		);

		const isInvalidValue = isInvalid || fieldContext?.isInvalid;

		// Modify the address from parent component
		useEffect(() => {
			onChangeAddress(address, false);
		}, [address]); // eslint-disable-line react-hooks/exhaustive-deps

		const { allAddresses } = useProfileAddresses({ network, profile }, exceptMultiSignature);

		const recipientOptions = allAddresses.map(({ address }: AddressProperties) => ({
			label: address,
			value: address,
		}));

		const openRecipients = () => {
			if (disabled) {
				return;
			}

			setIsRecipientSearchOpen(true);
		};

		const onAction = useCallback(
			(changedAddress: string) => {
				onChangeAddress(changedAddress);
				setIsRecipientSearchOpen(false);
			},
			[onChangeAddress, setIsRecipientSearchOpen],
		);

		return (
			<div>
				<div data-testid="SelectRecipient__wrapper" className="flex relative items-center w-full text-left">
					<Select
						id="SelectRecipient__dropdown"
						showCaret={false}
						isInvalid={isInvalidValue}
						disabled={disabled}
						defaultValue={selectedAddress}
						placeholder={placeholder}
						ref={reference}
						options={showOptions ? recipientOptions : []}
						showOptions={showOptions}
						allowFreeInput={true}
						onChange={(option: any) => onChangeAddress(option.value)}
						addons={{
							end: showOptions
								? {
										content: (
											<div
												data-testid="SelectRecipient__select-recipient"
												className={cn("flex items-center", { "cursor-pointer": !disabled })}
												onClick={openRecipients}
											>
												<Icon name="User" size="lg" />
											</div>
										),
								  }
								: undefined,
							start: {
								content: (
									<div className="flex items-center">
										<ProfileAvatar address={selectedAddress} />
										{!!selectedAddressAlias?.alias && (
											<TruncateEnd
												className="font-semibold ml-2"
												text={selectedAddressAlias.alias}
												showTooltip
											/>
										)}
									</div>
								),
							},
						}}
						renderLabel={(option) => <OptionLabel option={option} network={network} profile={profile} />}
					/>
				</div>

				<SearchRecipient
					isOpen={isRecipientSearchOpen}
					recipients={allAddresses}
					onAction={onAction}
					onClose={() => setIsRecipientSearchOpen(false)}
					selectedAddress={selectedAddress}
				/>
			</div>
		);
	},
);

SelectRecipient.displayName = "SelectRecipient";
