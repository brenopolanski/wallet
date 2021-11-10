import { Circle } from "app/components/Circle";
import { Icon } from "app/components/Icon";
import {
	TransactionDetail,
	TransactionDetailProperties,
} from "domains/transaction/components/TransactionDetail/TransactionDetail";
import { useTransactionTypes } from "domains/transaction/hooks/use-transaction-types";
import React from "react";
import { useTranslation } from "react-i18next";

type TransactionSenderProperties = {
	type: string;
} & TransactionDetailProperties;

export const TransactionType = ({ type, ...properties }: TransactionSenderProperties) => {
	const { t } = useTranslation();

	const { getIcon, getLabel } = useTransactionTypes();

	return (
		<TransactionDetail
			data-testid="TransactionType"
			label={t("TRANSACTION.TRANSACTION_TYPE")}
			extra={
				<Circle
					className="text-theme-text border-theme-text dark:text-theme-secondary-600 dark:border-theme-secondary-600"
					size="lg"
				>
					<Icon name={getIcon(type)} size="lg" />
				</Circle>
			}
			{...properties}
		>
			{getLabel(type)}
		</TransactionDetail>
	);
};
