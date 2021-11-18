import { DTO } from "@payvo/sdk-profiles";
import { PendingTransaction } from "domains/transaction/components/TransactionTable/PendingTransactionsTable/PendingTransactionsTable.contracts";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Column } from "react-table";

export const useTransactionTableColumns = (exchangeCurrency?: string) => {
	const { t } = useTranslation();

	return useMemo<Column<DTO.ExtendedConfirmedTransactionData>[]>(() => {
		const templateColumns: Column<DTO.ExtendedConfirmedTransactionData>[] = [
			{
				Header: t("COMMON.ID"),
				minimumWidth: true,
			},
			{
				Header: t("COMMON.DATE"),
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				accessor: (transaction) => transaction.timestamp?.()?.toUNIX(),
				cellWidth: "w-50",
				id: "date",
				sortDescFirst: true,
			},
			{
				Header: t("COMMON.SENDER"),
				cellWidth: "w-96",
			},
			{
				Header: t("COMMON.RECIPIENT"),
				cellWidth: "w-96",
			},
			{
				Header: t("COMMON.AMOUNT"),
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				accessor: (transaction) => transaction.total?.(),
				className: "justify-end",
				id: "amount",
				sortDescFirst: true,
			},
		];

		if (exchangeCurrency) {
			templateColumns.push({
				Header: t("COMMON.CURRENCY"),
				cellWidth: "w-28",
				className: "justify-end float-right",
				responsiveClass: "hidden xl:table-cell",
			});
		}

		return templateColumns;
	}, [t, exchangeCurrency]);
};

export const usePendingTransactionTableColumns = () => {
	const { t } = useTranslation();

	return useMemo<Column<PendingTransaction>[]>(
		() => [
			{
				Header: t("COMMON.ID"),
				minimumWidth: true,
			},
			{
				Header: t("COMMON.DATE"),
				accessor: () => "timestamp",
				cellWidth: "w-50",
				sortDescFirst: true,
			},
			{
				Header: t("COMMON.RECIPIENT"),
				cellWidth: "w-96",
			},
			{
				Header: t("COMMON.STATUS"),
				cellWidth: "w-20",
				className: "justify-center",
			},
			{
				Header: t("COMMON.AMOUNT"),
				accessor: () => "amount",
				className: "justify-end",
			},
			{
				Header: t("COMMON.SIGN"),
				cellWidth: "w-24",
				className: "hidden no-border",
			},
		],
		[t],
	);
};
