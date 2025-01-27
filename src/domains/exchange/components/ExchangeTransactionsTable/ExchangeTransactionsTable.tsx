import { Contracts } from "@payvo/sdk-profiles";
import { EmptyBlock } from "app/components/EmptyBlock";
import { Table } from "app/components/Table";
import React, { FC, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Column, TableState } from "react-table";

import { ExchangeTransactionsRow } from "./ExchangeTransactionsRow";
import { ExchangeTransactionsTableProperties } from "./ExchangeTransactionsTable.contracts";

export const ExchangeTransactionsTable: FC<ExchangeTransactionsTableProperties> = ({
	exchangeTransactions,
	isCompact,
	onClick,
	onRemove,
}) => {
	const { t } = useTranslation();

	const initialState = useMemo<Partial<TableState<Contracts.IExchangeTransaction>>>(
		() => ({
			sortBy: [
				{
					desc: true,
					id: "createdAt",
				},
			],
		}),
		[],
	);

	const columns = useMemo<Column<Contracts.IExchangeTransaction>[]>(
		() => [
			{
				Header: t("COMMON.ID"),
				minimumWidth: true,
			},
			{
				Header: t("COMMON.EXCHANGE"),
				accessor: "provider",
			},
			{
				Header: t("COMMON.DATE"),
				accessor: "createdAt",
			},
			{
				Header: t("COMMON.FROM"),
				accessor: (exchangeTransaction) => exchangeTransaction.input().ticker,
			},
			{
				Header: t("COMMON.TO"),
				accessor: (exchangeTransaction) => exchangeTransaction.output().ticker,
			},
			{
				Header: t("COMMON.STATUS"),
				cellWidth: "w-24",
				className: "justify-center",
			},
			{
				Header: "Actions",
				className: "hidden no-border",
				minimumWidth: true,
			},
		],
		[t],
	);

	const tableData = useMemo(() => exchangeTransactions, [exchangeTransactions]);

	const renderTableRow = useCallback(
		(exchangeTransaction: Contracts.IExchangeTransaction) => (
			<ExchangeTransactionsRow
				exchangeTransaction={exchangeTransaction}
				isCompact={isCompact}
				onClick={onClick}
				onRemove={onRemove}
			/>
		),
		[isCompact, onClick, onRemove],
	);

	if (tableData.length === 0) {
		return (
			<EmptyBlock data-testid="ExchangeTransactionsTable__empty-message">
				{t("EXCHANGE.EMPTY_MESSAGE")}
			</EmptyBlock>
		);
	}

	return (
		<div data-testid="ExchangeTransactionsTable">
			<Table columns={columns} data={tableData} initialState={initialState}>
				{renderTableRow}
			</Table>
		</div>
	);
};
