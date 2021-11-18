import { DTO } from "@payvo/sdk-profiles";
import { Table } from "app/components/Table";
import { useTransactionTableColumns } from "domains/transaction/components/TransactionTable/TransactionTable.helpers";
import React, { FC, useCallback, useMemo } from "react";
import { TableState } from "react-table";

import { TransactionRow } from "./TransactionRow/TransactionRow";
import { TransactionTableProperties } from "./TransactionTable.contracts";

export const TransactionTable: FC<TransactionTableProperties> = ({
	transactions,
	exchangeCurrency,
	hideHeader = false,
	isLoading = false,
	skeletonRowsLimit = 8,
	onRowClick,
	profile,
}) => {
	const columns = useTransactionTableColumns(exchangeCurrency);
	const initialState = useMemo<Partial<TableState<DTO.ExtendedConfirmedTransactionData>>>(
		() => ({
			sortBy: [
				{
					desc: true,
					id: "date",
				},
			],
		}),
		[],
	);

	const showSkeleton = isLoading && transactions.length === 0;

	const data = useMemo<DTO.ExtendedConfirmedTransactionData[]>(() => {
		const skeletonRows = new Array(skeletonRowsLimit).fill({} as DTO.ExtendedConfirmedTransactionData);
		return showSkeleton ? skeletonRows : transactions;
	}, [showSkeleton, transactions, skeletonRowsLimit]);

	const renderTableRow = useCallback(
		(row: DTO.ExtendedConfirmedTransactionData) => (
			<TransactionRow
				isLoading={showSkeleton}
				onClick={() => onRowClick?.(row)}
				transaction={row}
				exchangeCurrency={exchangeCurrency}
				profile={profile}
			/>
		),
		[showSkeleton, onRowClick, exchangeCurrency, profile],
	);

	return (
		<div data-testid="TransactionTable" className="relative">
			<Table hideHeader={hideHeader} columns={columns} data={data} initialState={initialState}>
				{renderTableRow}
			</Table>
		</div>
	);
};
