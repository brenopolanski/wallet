import { Contracts } from "@payvo/profiles";
import { AmountLabel } from "app/components/Amount";
import { Skeleton } from "app/components/Skeleton";
import cn from "classnames";
import React from "react";
import { useTranslation } from "react-i18next";

interface Properties {
	isLoading: boolean;
	isLoadingFee: boolean;
	amount: number;
	fee: number;
	wallet: Contracts.IReadWriteWallet;
}

export const UnlockTokensTotal: React.FC<Properties> = ({
	isLoading,
	isLoadingFee,
	amount,
	fee,
	wallet,
}: Properties) => {
	const { t } = useTranslation();

	const renderTotal = (isFee: boolean) => {
		let hint: string | undefined = undefined;

		if (isFee && wallet.balance("available") < fee) {
			hint = t("TRANSACTION.UNLOCK_TOKENS.INSUFFICIENT_BALANCE_HINT", {
				currency: wallet.currency(),
			});
		}

		return (
			<div data-testid="UnlockTokensTotal" className={cn("flex flex-col", isFee ? "items-end" : "items-start")}>
				<p className="text-theme-secondary-500 text-sm font-semibold mb-2">
					{isFee ? t("TRANSACTION.TRANSACTION_FEE") : t("TRANSACTION.TOTAL_AMOUNT")}
				</p>
				{isLoading || (isFee && isLoadingFee) ? (
					<Skeleton width={60} height={28} />
				) : (
					<AmountLabel
						value={isFee ? fee : amount}
						ticker={wallet.currency()}
						isNegative={isFee}
						hint={hint}
					/>
				)}
			</div>
		);
	};

	return (
		<div className="flex items-center justify-between mt-4">
			{renderTotal(false)}
			{renderTotal(true)}
		</div>
	);
};
