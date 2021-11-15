import { Contracts } from "@payvo/sdk-profiles";
import { Header } from "app/components/Header";
import { TotalAmountBox } from "domains/transaction/components/TotalAmountBox";
import {
	TransactionMemo,
	TransactionNetwork,
	TransactionRecipients,
	TransactionSender,
} from "domains/transaction/components/TransactionDetail";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface ReviewStepProperties {
	wallet: Contracts.IReadWriteWallet;
}

export const ReviewStep: React.FC<ReviewStepProperties> = ({ wallet }: ReviewStepProperties) => {
	const { t } = useTranslation();

	const { unregister, watch } = useFormContext();
	const { fee, recipients, memo } = watch();

	let amount = 0;

	for (const recipient of recipients) {
		amount += recipient.amount;
	}

	useEffect(() => {
		unregister("mnemonic");
	}, [unregister]);

	return (
		<section data-testid="SendTransfer__review-step">
			<Header title={t("TRANSACTION.REVIEW_STEP.TITLE")} subtitle={t("TRANSACTION.REVIEW_STEP.DESCRIPTION")} />

			<TransactionNetwork network={wallet.network()} border={false} />

			<TransactionSender address={wallet.address()} network={wallet.network()} />

			<TransactionRecipients currency={wallet.currency()} recipients={recipients} />

			{memo && <TransactionMemo memo={memo} />}

			<div className={recipients.length > 1 && !memo ? "-mt-2" : "mt-2"}>
				<TotalAmountBox amount={amount} fee={fee} ticker={wallet.currency()} />
			</div>
		</section>
	);
};
