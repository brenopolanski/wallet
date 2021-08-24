import { Contracts, DTO } from "@payvo/profiles";
import { Button } from "app/components/Button";
import { Icon } from "app/components/Icon";
import { TableCell, TableRow } from "app/components/Table";
import { Tooltip } from "app/components/Tooltip";
import { useTimeFormat } from "app/hooks/use-time-format";
import { TransactionRowMemo } from "domains/transaction/components/TransactionTable/TransactionRow/TransactionRowMemo";
import { useMultiSignatureStatus } from "domains/transaction/hooks";
import React from "react";
import { useTranslation } from "react-i18next";

import { BaseTransactionRowAmount } from "./TransactionRowAmount";
import { BaseTransactionRowMode } from "./TransactionRowMode";
import { BaseTransactionRowRecipientLabel } from "./TransactionRowRecipientLabel";

const SignButton = ({
	isCompact,
	isAwaitingFinalSignature,
	canBeSigned,
	onClick,
}: {
	isCompact?: boolean;
	isAwaitingFinalSignature: boolean;
	canBeSigned: boolean;
	onClick?: () => void;
}) => {
	const { t } = useTranslation();

	if (!canBeSigned) {
		return null;
	}

	const ButtonContent = () => {
		if (isAwaitingFinalSignature) {
			return (
				<>
					<span>{t("COMMON.SEND")}</span>
					<Icon name="DoubleArrowRight" />
				</>
			);
		}

		return (
			<>
				<Icon name="Pencil" />
				<span>{t("COMMON.SIGN")}</span>
			</>
		);
	};

	if (isCompact) {
		return (
			<Button
				size="sm"
				data-testid="TransactionRow__sign"
				variant="transparent"
				className="text-theme-primary-600 hover:text-theme-primary-700"
				onClick={onClick}
			>
				<ButtonContent />
			</Button>
		);
	}

	return (
		<Button
			data-testid="TransactionRow__sign"
			variant={isAwaitingFinalSignature ? "primary" : "secondary"}
			onClick={onClick}
		>
			<ButtonContent />
		</Button>
	);
};

export const SignedTransactionRow = ({
	transaction,
	onSign,
	onRowClick,
	wallet,
	isCompact,
	showMemoColumn,
}: {
	transaction: DTO.ExtendedSignedTransactionData;
	onSign?: (transaction: DTO.ExtendedSignedTransactionData) => void;
	onRowClick?: (transaction: DTO.ExtendedSignedTransactionData) => void;
	wallet: Contracts.IReadWriteWallet;
	isCompact?: boolean;
	showMemoColumn: boolean;
}) => {
	const timeFormat = useTimeFormat();
	const recipient = transaction.get<string>("recipientId");
	const { canBeSigned, isAwaitingFinalSignature, status } = useMultiSignatureStatus({ transaction, wallet });

	return (
		<TableRow onClick={() => onRowClick?.(transaction)}>
			<TableCell variant="start" isCompact={isCompact}>
				<Tooltip content={transaction.id()}>
					<span className="text-theme-secondary-300 dark:text-theme-secondary-800">
						<Icon name="MagnifyingGlassId" />
					</span>
				</Tooltip>
			</TableCell>

			<TableCell innerClassName="text-theme-secondary-text" isCompact={isCompact}>
				<span data-testid="TransactionRow__timestamp">{transaction.timestamp().format(timeFormat)}</span>
			</TableCell>

			<TableCell innerClassName="space-x-4" isCompact={isCompact}>
				<BaseTransactionRowMode
					isSent={true}
					type={transaction.type()}
					recipient={recipient}
					iconSize={isCompact ? "xs" : "lg"}
				/>

				<BaseTransactionRowRecipientLabel type={transaction.type()} recipient={recipient} />
			</TableCell>

			{showMemoColumn && (
				<TableCell innerClassName="justify-center" isCompact={isCompact}>
					<TransactionRowMemo memo={transaction.memo()} />
				</TableCell>
			)}

			<TableCell className="w-16" innerClassName="justify-center truncate" isCompact={isCompact}>
				<Tooltip content={status.label}>
					<span className={`p-1 ${status.className}`}>
						<Icon name={status.icon} size="lg" />
					</span>
				</Tooltip>
			</TableCell>

			<TableCell innerClassName="justify-end" isCompact={isCompact}>
				<BaseTransactionRowAmount
					isSent={true}
					total={transaction.amount() + transaction.fee()}
					wallet={wallet}
				/>
			</TableCell>

			<TableCell variant="end" innerClassName="justify-end" isCompact={isCompact}>
				<SignButton
					isCompact={isCompact}
					canBeSigned={canBeSigned}
					isAwaitingFinalSignature={isAwaitingFinalSignature}
					onClick={() => onSign?.(transaction)}
				/>
			</TableCell>
		</TableRow>
	);
};
