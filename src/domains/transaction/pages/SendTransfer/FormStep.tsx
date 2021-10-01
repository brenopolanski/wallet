import { Contracts } from "@payvo/profiles";
import { Enums, Networks } from "@payvo/sdk";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { InputCounter } from "app/components/Input";
import { useProfileJobs } from "app/hooks";
import { toasts } from "app/services";
import { SelectNetwork } from "domains/network/components/SelectNetwork";
import { SelectAddress } from "domains/profile/components/SelectAddress";
import { AddRecipient } from "domains/transaction/components/AddRecipient";
import { FeeField } from "domains/transaction/components/FeeField";
import { RecipientListItem } from "domains/transaction/components/RecipientList/RecipientList.models";
import { buildTransferData } from "domains/transaction/pages/SendTransfer/SendTransfer.helpers";
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const FormStep = ({
	networks,
	profile,
	deeplinkProps,
}: {
	networks: Networks.Network[];
	profile: Contracts.IProfile;
	deeplinkProps: any;
}) => {
	const isMounted = useRef(true);

	const { t } = useTranslation();

	const { syncProfileWallets } = useProfileJobs(profile);

	const [wallets, setWallets] = useState<Contracts.IReadWriteWallet[]>([]);

	const { getValues, setValue, watch } = useFormContext();
	const { recipients, memo = "" } = getValues();
	const { network, senderAddress } = watch();

	const senderWallet = profile.wallets().findByAddress(senderAddress);

	const [feeTransactionData, setFeeTransactionData] = useState<Record<string, any> | undefined>();

	useEffect(() => {
		if (!network) {
			return;
		}

		const updateFeeTransactionData = async () => {
			const transferData = await buildTransferData({
				coin: profile.coins().get(network.coin(), network.id()),
				memo,
				recipients,
			});

			/* istanbul ignore next */
			if (isMounted.current) {
				setFeeTransactionData(transferData);
			}
		};

		updateFeeTransactionData();
	}, [network, memo, recipients, profile, isMounted]);

	useEffect(() => {
		if (!network) {
			return;
		}

		setWallets(profile.wallets().findByCoinWithNetwork(network.coin(), network.id()));
	}, [network, profile]);

	useEffect(
		/* istanbul ignore next */
		() => () => {
			isMounted.current = false;
		},
		[],
	);

	const getRecipients = () => {
		if (deeplinkProps?.recipient && deeplinkProps?.amount) {
			return [
				{
					address: deeplinkProps.recipient,
					amount: senderWallet?.coin().bigNumber().make(deeplinkProps.amount),
				},
			];
		}

		return recipients;
	};

	const handleSelectSender = (address: any) => {
		setValue("senderAddress", address, { shouldDirty: true, shouldValidate: false });

		const senderWallet = profile.wallets().findByAddress(address);
		const isFullyRestoredAndSynced = senderWallet?.hasBeenFullyRestored() && senderWallet?.hasSyncedWithNetwork();

		if (!isFullyRestoredAndSynced) {
			syncProfileWallets(true);
		}
	};

	const showFeeInput = useMemo(() => !network?.chargesZeroFees(), [network]);

	return (
		<section data-testid="SendTransfer__form-step">
			<Header
				title={t("TRANSACTION.PAGE_TRANSACTION_SEND.FORM_STEP.TITLE", { ticker: senderWallet?.currency() })}
				subtitle={t("TRANSACTION.PAGE_TRANSACTION_SEND.FORM_STEP.DESCRIPTION")}
			/>

			<div className="pt-6 space-y-6">
				<FormField name="network">
					<FormLabel label={t("COMMON.CRYPTOASSET")} />
					<SelectNetwork
						id="SendTransfer__network"
						networks={networks}
						selected={network}
						disabled
						hideOptions
					/>
				</FormField>

				<FormField name="senderAddress">
					<FormLabel label={t("TRANSACTION.SENDER")} />

					<div data-testid="sender-address">
						<SelectAddress
							address={senderAddress}
							wallets={wallets}
							profile={profile}
							disabled={wallets.length === 0}
							onChange={handleSelectSender}
						/>
					</div>
				</FormField>

				<div data-testid="recipient-address">
					<AddRecipient
						assetSymbol={senderWallet?.currency()}
						profile={profile}
						wallet={senderWallet}
						recipients={getRecipients()}
						showMultiPaymentOption={network?.allows(Enums.FeatureFlag.TransactionMultiPayment)}
						disableMultiPaymentOption={senderWallet?.isLedger()}
						withDeeplink={!!deeplinkProps?.recipient}
						onChange={(value: RecipientListItem[]) =>
							setValue("recipients", value, { shouldDirty: true, shouldValidate: true })
						}
						onTypeChange={() => {
							toasts.warning(t("TRANSACTION.PAGE_TRANSACTION_SEND.FORM_STEP.FEE_UPDATE"));
						}}
					/>
				</div>

				<FormField name="memo" className="relative">
					<FormLabel label={t("COMMON.MEMO")} optional />
					<InputCounter
						data-testid="Input__memo"
						type="text"
						placeholder=" "
						maxLengthLabel="255"
						value={memo}
						onChange={(event: ChangeEvent<HTMLInputElement>) =>
							setValue("memo", event.target.value, { shouldDirty: true, shouldValidate: true })
						}
					/>
				</FormField>

				{showFeeInput && (
					<FormField name="fee">
						<FormLabel label={t("TRANSACTION.TRANSACTION_FEE")} />
						{!!network && (
							<FeeField
								type={recipients?.length > 1 ? "multiPayment" : "transfer"}
								data={feeTransactionData}
								network={network}
								profile={profile}
							/>
						)}
					</FormField>
				)}
			</div>
		</section>
	);
};
