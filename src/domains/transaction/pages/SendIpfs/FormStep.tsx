import { Contracts } from "@payvo/sdk-profiles";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { InputDefault } from "app/components/Input";
import { useFees } from "app/hooks";
import { FeeField } from "domains/transaction/components/FeeField";
import { TransactionNetwork, TransactionSender } from "domains/transaction/components/TransactionDetail";
import React, { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

const FormStep = ({ profile, wallet }: { profile: Contracts.IProfile; wallet: Contracts.IReadWriteWallet }) => {
	const { t } = useTranslation();

	const { calculate } = useFees(profile);

	const { getValues, setValue, watch } = useFormContext();
	const { hash } = watch();

	const network = useMemo(() => wallet.network(), [wallet]);
	const feeTransactionData = useMemo(() => ({ hash }), [hash]);

	useEffect(() => {
		const setTransactionFees = async (wallet: Contracts.IReadWriteWallet) => {
			const transactionFees = await calculate({
				coin: wallet.coinId(),
				network: wallet.networkId(),
				type: "ipfs",
			});

			setValue("fees", transactionFees);

			if (!getValues("fee")) {
				setValue("fee", transactionFees?.avg, {
					shouldDirty: true,
					shouldValidate: true,
				});
			}
		};

		setTransactionFees(wallet);
	}, [calculate, getValues, wallet, setValue]);

	return (
		<section data-testid="SendIpfs__form-step">
			<Header
				title={t("TRANSACTION.PAGE_IPFS.FIRST_STEP.TITLE")}
				subtitle={t("TRANSACTION.PAGE_IPFS.FIRST_STEP.DESCRIPTION")}
			/>

			<TransactionNetwork network={wallet.network()} border={false} />

			<TransactionSender address={wallet.address()} network={wallet.network()} borderPosition="both" />

			<div className="pt-6 space-y-6">
				<FormField name="hash">
					<FormLabel label={t("TRANSACTION.IPFS_HASH")} />
					<InputDefault
						data-testid="Input__hash"
						type="text"
						placeholder=" "
						defaultValue={hash}
						onChange={(event: any) =>
							setValue("hash", event.target.value, {
								shouldDirty: true,
								shouldValidate: true,
							})
						}
					/>
				</FormField>

				<FormField name="fee">
					<FormLabel label={t("TRANSACTION.TRANSACTION_FEE")} />
					<FeeField type="ipfs" data={feeTransactionData} network={network} profile={profile} />
				</FormField>
			</div>
		</section>
	);
};

export { FormStep };
