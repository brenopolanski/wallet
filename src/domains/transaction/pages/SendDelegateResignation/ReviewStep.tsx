import { Contracts } from "@payvo/sdk-profiles";
import { Header } from "app/components/Header";
import { TotalAmountBox } from "domains/transaction/components/TotalAmountBox";
import {
	TransactionDetail,
	TransactionNetwork,
	TransactionSender,
} from "domains/transaction/components/TransactionDetail";
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const ReviewStep = ({ senderWallet }: { senderWallet: Contracts.IReadWriteWallet }) => {
	const { t } = useTranslation();

	const { getValues, unregister } = useFormContext();

	useEffect(() => {
		unregister("mnemonic");
	}, [unregister]);

	return (
		<section data-testid="SendDelegateResignation__review-step">
			<Header title={t("TRANSACTION.REVIEW_STEP.TITLE")} subtitle={t("TRANSACTION.REVIEW_STEP.DESCRIPTION")} />

			<TransactionNetwork network={senderWallet.network()} border={false} />

			<TransactionSender address={senderWallet.address()} network={senderWallet.network()} />

			<TransactionDetail label={t("TRANSACTION.DELEGATE_NAME")}>{senderWallet.username()}</TransactionDetail>

			<div className="mt-2">
				<TotalAmountBox amount={0} fee={getValues("fee")} ticker={senderWallet.currency()} />
			</div>
		</section>
	);
};
