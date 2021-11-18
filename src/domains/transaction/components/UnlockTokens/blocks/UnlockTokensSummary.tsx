import { DTO } from "@payvo/sdk-profiles";
import {
	TransactionAmount,
	TransactionFee,
	TransactionTimestamp,
} from "domains/transaction/components/TransactionDetail";
import { TransactionSuccessful } from "domains/transaction/components/TransactionSuccessful";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface UnlockTokensSummaryProperties {
	transaction: DTO.ExtendedSignedTransactionData;
}

export const UnlockTokensSummary = ({ transaction }: UnlockTokensSummaryProperties) => {
	const { t } = useTranslation();

	const wallet = useMemo(() => transaction.wallet(), [transaction]);

	return (
		<TransactionSuccessful
			transaction={transaction}
			senderWallet={wallet}
			title={t("TRANSACTION.UNLOCK_TOKENS.SUMMARY.TITLE")}
			description={t("TRANSACTION.UNLOCK_TOKENS.SUMMARY.DESCRIPTION")}
		>
			<TransactionAmount
				isTotalAmount
				amount={transaction.amount()}
				convertedAmount={transaction.convertedAmount()}
				currency={wallet.currency()}
				exchangeCurrency={wallet.exchangeCurrency()}
				isSent={false}
			/>

			<TransactionFee
				value={transaction.fee()}
				convertedValue={transaction.convertedFee()}
				currency={wallet.currency()}
				exchangeCurrency={wallet.exchangeCurrency()}
			/>

			<TransactionTimestamp timestamp={transaction.timestamp()} />
		</TransactionSuccessful>
	);
};
