import { Enums, Networks } from "@payvo/sdk";
import { Contracts } from "@payvo/sdk-profiles";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { InputCounter } from "app/components/Input";
import { useProfileJobs } from "app/hooks";
import { SelectNetwork } from "domains/network/components/SelectNetwork";
import { SelectAddress } from "domains/profile/components/SelectAddress";
import { AddRecipient } from "domains/transaction/components/AddRecipient";
import { FeeField } from "domains/transaction/components/FeeField";
import { RecipientItem } from "domains/transaction/components/RecipientList/RecipientList.contracts";
import { buildTransferData } from "domains/transaction/pages/SendTransfer/SendTransfer.helpers";
import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { assertNetwork } from "utils/assertions";

export const FormStep = ({
	networks,
	profile,
	deeplinkProps,
}: {
	networks: Networks.Network[];
	profile: Contracts.IProfile;
	deeplinkProps: Record<string, string>;
}) => {
	const isMounted = useRef(true);

	const { t } = useTranslation();

	const { syncProfileWallets } = useProfileJobs(profile);

	const [wallets, setWallets] = useState<Contracts.IReadWriteWallet[]>([]);

	const { getValues, setValue, watch } = useFormContext();
	const { recipients, memo = "" } = getValues();
	const { network, senderAddress } = watch();

	const walletBySenderAddress = useMemo(() => {
		if (network) {
			assertNetwork(network);
			return profile.wallets().findByAddressWithNetwork(senderAddress, network.id());
		}
		return undefined;
	}, [network, profile, senderAddress]);

	const [senderWallet, setSenderWallet] = useState<Contracts.IReadWriteWallet | undefined>(walletBySenderAddress);

	useEffect(() => {
		setSenderWallet(walletBySenderAddress);
	}, [walletBySenderAddress]);

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

	const getRecipients = (): RecipientItem[] => {
		if (deeplinkProps.recipient && deeplinkProps.amount) {
			return [
				{
					address: deeplinkProps.recipient,
					amount: +deeplinkProps.amount,
				},
			];
		}

		return recipients;
	};

	const handleSelectSender = (address: any) => {
		setValue("senderAddress", address, { shouldDirty: true, shouldValidate: false });

		const newSenderWallet = profile.wallets().findByAddressWithNetwork(address, network.id());
		const isFullyRestoredAndSynced = senderWallet?.hasBeenFullyRestored() && senderWallet?.hasSyncedWithNetwork();
		setSenderWallet(newSenderWallet);

		if (!isFullyRestoredAndSynced) {
			syncProfileWallets(true);
		}
	};

	const showFeeInput = useMemo(() => !network?.chargesZeroFees(), [network]);

	return (
		<section data-testid="SendTransfer__form-step">
			<Header
				title={t("TRANSACTION.PAGE_TRANSACTION_SEND.FORM_STEP.TITLE", { ticker: network?.ticker() })}
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
							wallet={
								senderWallet
									? {
											address: senderWallet.address(),
											network: senderWallet.network(),
									  }
									: undefined
							}
							wallets={wallets}
							profile={profile}
							disabled={wallets.length === 0}
							onChange={handleSelectSender}
						/>
					</div>
				</FormField>

				<div data-testid="recipient-address">
					<AddRecipient
						disableMultiPaymentOption={senderWallet?.isLedger()}
						onChange={(value: RecipientItem[]) => {
							setValue("recipients", value, { shouldDirty: true, shouldValidate: true });
						}}
						profile={profile}
						recipients={getRecipients()}
						showMultiPaymentOption={network?.allows(Enums.FeatureFlag.TransactionMultiPayment)}
						wallet={senderWallet}
						withDeeplink={!!deeplinkProps.recipient}
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
