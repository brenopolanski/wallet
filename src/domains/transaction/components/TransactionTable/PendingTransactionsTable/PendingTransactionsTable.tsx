import { DTO } from "@payvo/profiles";
import { Table } from "app/components/Table";
import { ConfirmRemovePendingTransaction } from "domains/transaction/components/ConfirmRemovePendingTransaction";
import { PendingTransferRow } from "domains/transaction/components/TransactionTable/TransactionRow/PendingTransferRow";
import { SignedTransactionRow } from "domains/transaction/components/TransactionTable/TransactionRow/SignedTransactionRow";
import { usePendingTransactionTableColumns } from "domains/transaction/components/TransactionTable/TransactionTable.helpers";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { PendingTransaction, Properties } from "./PendingTransactionsTable.contracts";

export const PendingTransactions = ({
	wallet,
	onClick,
	onRemove,
	onPendingTransactionClick,
	pendingTransactions,
	isCompact,
}: Properties) => {
	const { t } = useTranslation();
	const [pendingRemovalTransaction, setPendingRemovalTransaction] = useState<DTO.ExtendedSignedTransactionData>();

	const columns = usePendingTransactionTableColumns();

	const renderTableRow = useCallback(
		(transaction: PendingTransaction) => {
			if (transaction.isPendingTransfer) {
				return (
					<PendingTransferRow
						isCompact={isCompact}
						wallet={wallet}
						transaction={transaction.transaction as DTO.ExtendedConfirmedTransactionData}
						onRowClick={onPendingTransactionClick}
					/>
				);
			}

			return (
				<SignedTransactionRow
					isCompact={isCompact}
					transaction={transaction.transaction as DTO.ExtendedSignedTransactionData}
					wallet={wallet}
					onSign={onClick}
					onRowClick={onClick}
					onRemovePendingTransaction={setPendingRemovalTransaction}
				/>
			);
		},
		[isCompact, wallet, onClick, setPendingRemovalTransaction, onPendingTransactionClick],
	);

	const handleRemove = async (transaction: DTO.ExtendedSignedTransactionData) => {
		await wallet.coin().multiSignature().forgetById(transaction?.id());
		setPendingRemovalTransaction(undefined);
		onRemove?.(transaction);
	};

	return (
		<div data-testid="PendingTransactions" className="relative">
			<h2 className="mb-6 text-2xl font-bold">{t("WALLETS.PAGE_WALLET_DETAILS.PENDING_TRANSACTIONS")}</h2>

			<Table columns={columns} data={pendingTransactions}>
				{renderTableRow}
			</Table>

			<ConfirmRemovePendingTransaction
				isOpen={!!pendingRemovalTransaction}
				transaction={pendingRemovalTransaction}
				onClose={() => setPendingRemovalTransaction(undefined)}
				onRemove={handleRemove}
			/>
		</div>
	);
};
