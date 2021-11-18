import { Contracts, DTO } from "@payvo/sdk-profiles";
import { TransactionSuccessful } from "domains/transaction/components/TransactionSuccessful";
import React from "react";
import { useTranslation } from "react-i18next";

interface SummaryStepProperties {
	transaction: DTO.ExtendedSignedTransactionData;
	senderWallet: Contracts.IReadWriteWallet;
	registrationForm: any;
}

export const SummaryStep = ({ registrationForm, transaction, senderWallet }: SummaryStepProperties) => {
	const { t } = useTranslation();

	return (
		<TransactionSuccessful transaction={transaction} senderWallet={senderWallet}>
			{registrationForm.transactionDetails && (
				<registrationForm.transactionDetails transaction={transaction} translations={t} wallet={senderWallet} />
			)}
		</TransactionSuccessful>
	);
};
