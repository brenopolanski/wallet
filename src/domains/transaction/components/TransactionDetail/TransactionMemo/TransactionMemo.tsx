import { Icon } from "app/components/Icon";
import { TransactionDetail } from "domains/transaction/components/TransactionDetail/TransactionDetail";
import React from "react";
import { useTranslation } from "react-i18next";

interface TransactionMemoProperties {
	memo?: string;
}

export const TransactionMemo = ({ memo }: TransactionMemoProperties) => {
	const { t } = useTranslation();

	return (
		<TransactionDetail
			data-testid="TransactionMemo"
			label={t("TRANSACTION.MEMO")}
			extra={
				<div className="flex justify-center w-11 text-theme-secondary-900 dark:text-theme-secondary-600">
					<Icon name="FileLines" size="lg" />
				</div>
			}
		>
			<p className="break-all whitespace-pre-line">{memo}</p>
		</TransactionDetail>
	);
};
