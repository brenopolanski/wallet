import { Contracts } from "@payvo/sdk-profiles";
import { Icon } from "app/components/Icon";
import { Skeleton } from "app/components/Skeleton";
import { Tooltip } from "app/components/Tooltip";
import { TotalAmountBox } from "domains/transaction/components/TotalAmountBox";
import {
	TransactionDetail,
	TransactionMemo,
	TransactionRecipients,
} from "domains/transaction/components/TransactionDetail";
import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";

export const TransferLedgerReview = ({
	wallet,
	estimatedExpiration,
}: {
	wallet: Contracts.IReadWriteWallet;
	estimatedExpiration?: number;
}) => {
	const { t } = useTranslation();
	const { getValues } = useFormContext();

	const { fee, recipients, memo } = getValues();

	let amount = 0;
	for (const recipient of recipients) {
		amount += recipient.amount;
	}

	const expirationType = wallet.network().expirationType();

	const expirationTypeTranslations = {
		height: t("TRANSACTION.EXPIRATION.HEIGHT"),
		timestamp: t("TRANSACTION.EXPIRATION.TIMESTAMP"),
	};

	const renderExpiration = () => {
		if (estimatedExpiration) {
			return estimatedExpiration;
		}

		return (
			<span data-testid="TransferLedgerReview__expiration-skeleton" className="flex my-0.5">
				<Skeleton height={16} width={80} />
			</span>
		);
	};

	return (
		<>
			<TransactionRecipients currency={wallet.currency()} recipients={recipients} border={false} />

			{memo && <TransactionMemo memo={memo} />}

			<TransactionDetail
				label={
					<div data-testid="LedgerReview__expiration" className="flex items-center space-x-2">
						<span>{t("COMMON.EXPIRATION")}</span>

						<Tooltip content={expirationTypeTranslations[expirationType]}>
							<div className="flex justify-center items-center w-5 h-5 rounded-full cursor-pointer questionmark bg-theme-primary-100 hover:bg-theme-primary-700 dark:bg-theme-secondary-800 text-theme-primary-600 dark:text-theme-secondary-200 hover:text-white">
								<Icon name="QuestionMarkSmall" size="sm" />
							</div>
						</Tooltip>
					</div>
				}
			>
				{renderExpiration()}
			</TransactionDetail>

			<div className="mt-2">
				<TotalAmountBox amount={amount} fee={fee} ticker={wallet.currency()} />
			</div>
		</>
	);
};
