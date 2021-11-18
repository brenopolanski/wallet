import { Contracts, DTO } from "@payvo/sdk-profiles";
import { Header } from "app/components/Header";
import { Image } from "app/components/Image";
import {
	TransactionExplorerLink,
	TransactionNetwork,
	TransactionSender,
	TransactionType,
} from "domains/transaction/components/TransactionDetail";
import React from "react";
import { useTranslation } from "react-i18next";

import { MultiSignatureSuccessful } from "./MultiSignatureSuccessful";

interface TransactionSuccessfulProperties {
	transaction: DTO.ExtendedSignedTransactionData;
	senderWallet: Contracts.IReadWriteWallet;
	title?: string;
	description?: string;
	children?: React.ReactNode;
}

export const TransactionSuccessful = ({
	transaction,
	senderWallet,
	title,
	description,
	children,
}: TransactionSuccessfulProperties) => {
	const { t } = useTranslation();

	if (transaction.isMultiSignatureRegistration() || transaction.usesMultiSignature()) {
		return (
			<MultiSignatureSuccessful transaction={transaction} senderWallet={senderWallet}>
				{children}
			</MultiSignatureSuccessful>
		);
	}

	return (
		<section data-testid="TransactionSuccessful" className="space-y-8">
			<Header title={title ?? t("TRANSACTION.SUCCESS.TITLE")} />

			<Image name="TransactionSuccessBanner" domain="transaction" className="w-full" />

			<p className="text-theme-secondary-text">{description ?? t("TRANSACTION.SUCCESS.DESCRIPTION")}</p>

			<div>
				<TransactionExplorerLink transaction={transaction} border={false} paddingPosition="bottom" />

				<TransactionType type={transaction.type()} />

				<TransactionNetwork network={senderWallet.network()} />

				<TransactionSender address={senderWallet.address()} network={senderWallet.network()} />

				{children}
			</div>
		</section>
	);
};
