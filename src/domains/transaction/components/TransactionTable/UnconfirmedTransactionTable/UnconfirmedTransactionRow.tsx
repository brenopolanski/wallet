import { Contracts, DTO } from "@payvo/profiles";
import { TableCell, TableRow } from "app/components/Table";
import { TimeAgo } from "app/components/TimeAgo";
import { TransactionRowAmount } from "domains/transaction/components/TransactionTable/TransactionRow/TransactionRowAmount";
import { TransactionRowRecipient } from "domains/transaction/components/TransactionTable/TransactionRow/TransactionRowRecipient";
import React from "react";

type Properties = {
	transaction: DTO.ExtendedConfirmedTransactionData;
	profile: Contracts.IProfile;
} & React.HTMLProps<any>;

export const UnconfirmedTransactionRow = ({ transaction, profile, ...properties }: Properties) => {
	const isCompact = !profile.appearance().get("useExpandedTables");

	return (
		<TableRow {...properties}>
			<TableCell
				variant="start"
				innerClassName="space-x-3 text-theme-secondary-500 whitespace-nowrap"
				isCompact={isCompact}
			>
				<TimeAgo date={transaction.timestamp()?.toString() as string} />
			</TableCell>

			<TableCell innerClassName="space-x-4" isCompact={isCompact}>
				<TransactionRowRecipient transaction={transaction} profile={profile} isCompact={isCompact} />
			</TableCell>

			<TableCell variant="end" innerClassName="justify-end" isCompact={isCompact}>
				<TransactionRowAmount transaction={transaction} isCompact={isCompact} />
			</TableCell>
		</TableRow>
	);
};
