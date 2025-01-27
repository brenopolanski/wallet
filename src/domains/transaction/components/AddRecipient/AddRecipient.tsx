import { Contracts } from "@payvo/sdk-profiles";
import { Amount } from "app/components/Amount";
import { Button } from "app/components/Button";
import { FormField, FormLabel, SubForm } from "app/components/Form";
import { Icon } from "app/components/Icon";
import { InputCurrency } from "app/components/Input";
import { Switch } from "app/components/Switch";
import { Tooltip } from "app/components/Tooltip";
import { useValidation, WalletAliasResult } from "app/hooks";
import { useExchangeRate } from "app/hooks/use-exchange-rate";
import cn from "classnames";
import { SelectRecipient } from "domains/profile/components/SelectRecipient";
import { RecipientList } from "domains/transaction/components/RecipientList";
import { RecipientItem } from "domains/transaction/components/RecipientList/RecipientList.contracts";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import tw, { css, styled } from "twin.macro";

import { AddRecipientProperties, ToggleButtonProperties } from "./AddRecipient.models";
import { AddRecipientWrapper } from "./AddRecipient.styles";

const TransferType = ({ isSingle, disableMultiple, onChange, maxRecipients }: ToggleButtonProperties) => {
	const { t } = useTranslation();

	return (
		<div className="flex items-center space-x-2">
			<Tooltip
				content={t("TRANSACTION.PAGE_TRANSACTION_SEND.FORM_STEP.MULTIPLE_UNAVAILBLE")}
				disabled={!disableMultiple}
			>
				<span>
					<Switch
						size="sm"
						disabled={disableMultiple}
						value={isSingle}
						onChange={onChange}
						leftOption={{
							label: t("TRANSACTION.SINGLE"),
							value: true,
						}}
						rightOption={{
							label: t("TRANSACTION.MULTIPLE"),
							value: false,
						}}
					/>
				</span>
			</Tooltip>

			<Tooltip content={t("TRANSACTION.RECIPIENTS_HELPTEXT", { count: maxRecipients })}>
				<div className="flex justify-center items-center w-5 h-5 rounded-full cursor-pointer questionmark bg-theme-primary-100 hover:bg-theme-primary-700 dark:bg-theme-secondary-800 text-theme-primary-600 dark:text-theme-secondary-200 hover:text-white">
					<Icon name="QuestionMarkSmall" size="sm" />
				</div>
			</Tooltip>
		</div>
	);
};

const InputButtonStyled = styled.button(() => [
	tw`flex items-center h-full px-5 font-semibold text-theme-secondary-700`,
	tw`border-2 rounded border-theme-primary-100`,
	tw`transition-colors duration-300`,
	tw`dark:(border-theme-secondary-800 text-theme-secondary-200)`,
	tw`focus:(outline-none ring-2 ring-theme-primary-400)`,
	tw`disabled:(
		border border-theme-secondary-300 text-theme-secondary-500 cursor-not-allowed
		dark:(border-theme-secondary-700 text-theme-secondary-700)
	)`,
	css`
		&.active {
			${tw`border-theme-success-600 bg-theme-success-100 dark:bg-theme-success-900`}
		}
	`,
]);

export const AddRecipient = ({
	disableMultiPaymentOption,
	onChange,
	profile,
	recipients = [],
	showMultiPaymentOption = true,
	wallet,
	withDeeplink,
}: AddRecipientProperties) => {
	const { t } = useTranslation();
	const [addedRecipients, setAddedRecipients] = useState<RecipientItem[]>([]);
	const [isSingle, setIsSingle] = useState(recipients.length <= 1);
	const [recipientsAmount, setRecipientsAmount] = useState<string>();
	const isMountedReference = useRef(false);

	const {
		getValues,
		setValue,
		register,
		watch,
		trigger,
		clearErrors,
		formState: { errors },
	} = useFormContext();
	const { network, senderAddress, fee, recipientAddress, amount, recipientAlias, isSendAllSelected } = watch();
	const { sendTransfer } = useValidation();

	const ticker = network?.ticker();
	const exchangeTicker = profile.settings().get<string>(Contracts.ProfileSetting.ExchangeCurrency) as string;
	const { convert } = useExchangeRate({ exchangeTicker, ticker });

	const maxRecipients = network?.multiPaymentRecipients() ?? 0;

	const remainingBalance = useMemo(() => {
		const senderBalance = wallet?.balance() || 0;

		if (isSingle) {
			return senderBalance;
		}

		return addedRecipients.reduce((sum, item) => sum - Number(item.amount || 0), senderBalance);
	}, [addedRecipients, wallet, isSingle]);

	const remainingNetBalance = useMemo(() => {
		const netBalance = +(remainingBalance - (+fee || 0)).toFixed(10);

		return Math.sign(netBalance) ? netBalance : undefined;
	}, [fee, remainingBalance]);

	const isSenderFilled = useMemo(() => !!network?.id() && !!senderAddress, [network, senderAddress]);

	const clearFields = useCallback(() => {
		setValue("amount", undefined);
		setValue("recipientAddress", undefined);
	}, [setValue]);

	useEffect(() => {
		register("remainingBalance");
		register("isSendAllSelected");
		register("recipientAlias");
	}, [register]);

	useEffect(() => {
		const remaining = remainingBalance <= 0 ? 0 : remainingBalance;

		setValue("remainingBalance", remaining);
	}, [remainingBalance, setValue, amount, recipientAddress, fee, senderAddress]);

	useEffect(() => {
		if (!withDeeplink) {
			return;
		}

		setRecipientsAmount(
			recipients
				?.reduce((accumulator, currentValue) => Number(accumulator) + Number(currentValue.amount), 0)
				.toString(),
		);
	}, [recipients, withDeeplink]);

	useEffect(() => {
		register("amount", sendTransfer.amount(network, remainingNetBalance!, addedRecipients, isSingle));
		register("recipientAddress", sendTransfer.recipientAddress(profile, network, addedRecipients, isSingle));
	}, [register, network, sendTransfer, addedRecipients, isSingle, profile, remainingNetBalance]);

	useEffect(() => {
		if (network && recipientAddress) {
			trigger("recipientAddress");
		}
	}, [network, recipientAddress, trigger]);

	useEffect(() => {
		if (getValues("amount")) {
			trigger("amount");
		}
	}, [fee, senderAddress, getValues, trigger]);

	useEffect(() => {
		// Timeout prevents from showing error for recipientAddress when switching between transfer type
		setTimeout(() => clearErrors(), 0);

		if (!isMountedReference.current) {
			return;
		}

		if (isSingle && addedRecipients.length === 1) {
			setValue("amount", addedRecipients[0].amount);
			setValue("recipientAddress", addedRecipients[0].address);
			return;
		}

		// Clear the fields and update the recipient item(s) when switch between transfer type.
		// This is made to prevent enabling or disabling the "continue" button.
		if (isSingle && recipients.length !== 1) {
			clearFields();
			onChange([]);
			return;
		}

		/* istanbul ignore else */
		if (!isSingle) {
			if (addedRecipients.length > 0) {
				clearFields();
				onChange(addedRecipients);
				return;
			}

			onChange([]);
		}
	}, [isSingle, clearErrors, clearFields, addedRecipients, setValue]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (!isSingle) {
			setValue("isSendAllSelected", false);
		}
	}, [isSingle, setValue]);

	// Update AddedRecipients state when comes back to the current page
	useEffect(() => {
		if (isMountedReference.current) {
			return;
		}

		if (recipients.length === 0) {
			return;
		}

		setAddedRecipients(recipients);
	}, [recipients, setValue, getValues]);

	useEffect(() => {
		isMountedReference.current = true;
	}, []);

	useEffect(() => {
		if (!isSendAllSelected) {
			return;
		}

		const remaining = remainingBalance > fee ? remainingNetBalance : remainingBalance;

		setValue("amount", remaining, {
			shouldDirty: true,
			shouldValidate: true,
		});

		singleRecipientOnChange({
			address: recipientAddress,
			alias: recipientAlias,
			amount: remaining,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fee, isSendAllSelected, remainingBalance, remainingNetBalance, setValue]);

	const singleRecipientOnChange = ({
		address,
		alias,
		amount,
	}: {
		address: string | undefined;
		alias?: WalletAliasResult;
		amount: string | number | undefined;
	}) => {
		if (!isSingle) {
			return;
		}

		if (!address || !amount) {
			return onChange([]);
		}

		onChange([
			{
				address,
				alias: alias?.alias,
				amount: +amount,
				isDelegate: alias?.isDelegate,
			},
		]);
	};

	const handleAddRecipient = () => {
		const amount = getValues("amount");

		let newRecipient: RecipientItem = {
			address: recipientAddress,
			alias: recipientAlias?.alias,
			amount: +amount,
			isDelegate: recipientAlias?.isDelegate,
		};

		const newRecipients = [...addedRecipients, newRecipient];

		setAddedRecipients(newRecipients);
		onChange(newRecipients);
		clearFields();
	};

	const handleRemoveRecipient = (index: number) => {
		const remainingRecipients = [...addedRecipients];
		remainingRecipients.splice(index, 1);

		setAddedRecipients(remainingRecipients);
		onChange?.(remainingRecipients);
	};

	const amountAddons =
		!errors.amount && !errors.fee && isSenderFilled && !wallet?.network().isTest()
			? {
					end: {
						content: (
							<Amount
								value={convert(amount || 0)}
								ticker={exchangeTicker}
								data-testid="AddRecipient__currency-balance"
								className="text-sm font-semibold whitespace-no-break text-theme-secondary-500 dark:text-theme-secondary-700"
							/>
						),
					},
			  }
			: undefined;

	return (
		<AddRecipientWrapper>
			<div className="flex justify-between items-center mb-2 text-theme-secondary-text hover:text-theme-primary-600">
				<div className="text-sm font-semibold transition-colors duration-100">{t("TRANSACTION.RECIPIENT")}</div>

				{showMultiPaymentOption && (
					<TransferType
						maxRecipients={maxRecipients}
						isSingle={isSingle}
						disableMultiple={disableMultiPaymentOption}
						onChange={(isSingle) => {
							setIsSingle(isSingle);
						}}
					/>
				)}
			</div>

			<SubForm data-testid="AddRecipient__form-wrapper" noBackground={isSingle} noPadding={isSingle}>
				<div className="space-y-5">
					<FormField name="recipientAddress">
						{!isSingle && (
							<FormLabel label={t("COMMON.RECIPIENT_#", { count: addedRecipients.length + 1 })} />
						)}

						<SelectRecipient
							network={network}
							disabled={!isSenderFilled}
							address={recipientAddress}
							profile={profile}
							placeholder={t("COMMON.ADDRESS")}
							onChange={(address, alias) => {
								setValue("recipientAddress", address, { shouldDirty: true, shouldValidate: true });
								setValue("recipientAlias", alias);
								singleRecipientOnChange({
									address,
									alias,
									amount: getValues("amount"),
								});
							}}
						/>
					</FormField>

					<FormField name="amount">
						<FormLabel>
							<span>{t("COMMON.AMOUNT")}</span>
							{isSenderFilled && !!remainingNetBalance && (
								<span className="ml-1 text-theme-secondary-500 dark:text-theme-secondary-700">
									({t("COMMON.AVAILABLE")}{" "}
									<Amount value={remainingNetBalance} ticker={ticker} showTicker={false} />)
								</span>
							)}
						</FormLabel>

						<div className="flex space-x-2">
							<div className="flex-1">
								<InputCurrency
									disabled={!isSenderFilled}
									data-testid="AddRecipient__amount"
									placeholder={t("COMMON.AMOUNT_PLACEHOLDER")}
									value={getValues("amount") || recipientsAmount}
									addons={amountAddons}
									onChange={(amount: string) => {
										setValue("isSendAllSelected", false);
										setValue("amount", amount, { shouldDirty: true, shouldValidate: true });
										singleRecipientOnChange({
											address: recipientAddress,
											alias: recipientAlias,
											amount,
										});
									}}
								/>
							</div>

							{isSingle && (
								<div className="inline-flex">
									<InputButtonStyled
										type="button"
										disabled={!isSenderFilled}
										className={cn({ active: getValues("isSendAllSelected") })}
										onClick={() => {
											setValue("isSendAllSelected", !getValues("isSendAllSelected"));
										}}
										data-testid="AddRecipient__send-all"
									>
										{t("TRANSACTION.SEND_ALL")}
									</InputButtonStyled>
								</div>
							)}
						</div>
					</FormField>
				</div>

				{!isSingle && (
					<Button
						disabled={
							!!errors.amount ||
							!!errors.recipientAddress ||
							!getValues("amount") ||
							!getValues("recipientAddress") ||
							addedRecipients.length >= maxRecipients
						}
						data-testid="AddRecipient__add-button"
						variant="secondary"
						className="mt-4 w-full"
						onClick={handleAddRecipient}
					>
						{t("TRANSACTION.ADD_RECIPIENT")}
					</Button>
				)}
			</SubForm>

			{!isSingle && addedRecipients.length > 0 && (
				<div className="mt-3 border-b border-dashed border-theme-secondary-300 dark:border-theme-secondary-800">
					<RecipientList
						recipients={addedRecipients}
						onRemove={handleRemoveRecipient}
						ticker={ticker}
						showAmount
						showExchangeAmount={network.isLive()}
						isEditable
					/>
				</div>
			)}
		</AddRecipientWrapper>
	);
};
