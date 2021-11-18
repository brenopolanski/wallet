import { Contracts, DTO } from "@payvo/sdk-profiles";
import { Table } from "app/components/Table";
import React, { memo } from "react";
import { useTranslation } from "react-i18next";

import { UnconfirmedTransactionRow } from "./UnconfirmedTransactionRow";

interface Properties {
	transactions: DTO.ExtendedConfirmedTransactionData[];
	profile: Contracts.IProfile;
}

export const UnconfirmedTransactionTable = memo(({ transactions, profile }: Properties) => {
	const { t } = useTranslation();

	const columns: any = [
		{
			Header: t("COMMON.DATE"),
			accessor: (transaction: DTO.ExtendedConfirmedTransactionData) => transaction.timestamp?.()?.toUNIX(),
			sortDescFirst: true,
		},
		{
			Header: t("COMMON.RECIPIENT"),
			cellWidth: "w-96",
		},
		{
			Header: t("COMMON.AMOUNT"),
			accessor: (transaction: DTO.ExtendedConfirmedTransactionData) => transaction.total?.(),
			className: "justify-end",
		},
	];

	return (
		<div data-testid="TransactionTable" className="relative">
			<Table columns={columns} data={transactions}>
				{(row: DTO.ExtendedConfirmedTransactionData) => (
					<UnconfirmedTransactionRow transaction={row} profile={profile} />
				)}
			</Table>
		</div>
	);
});
