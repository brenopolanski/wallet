import { Amount } from "app/components/Amount";
import { Icon } from "app/components/Icon";
import React from "react";
import { useTranslation } from "react-i18next";
import tw from "twin.macro";
import { assertNumber } from "utils/assertions";

interface Properties {
	amount: number | string;
	fee: number | string;
	ticker: string;
}

const AmountLabel = tw.span`text-sm font-semibold text-theme-secondary-700`;

export const TotalAmountBox = ({ ticker, ...properties }: Properties) => {
	const { t } = useTranslation();

	const amount = +properties.amount;
	const fee = +properties.fee;

	assertNumber(amount);
	assertNumber(fee);

	const total = amount + fee;

	return (
		<div className="rounded-lg border border-theme-secondary-300 dark:border-theme-secondary-800">
			<div className="relative p-4">
				<div className="flex divide-x divide-theme-secondary-300 dark:divide-theme-secondary-800">
					<div className="flex flex-col justify-center py-2 px-4 w-1/2">
						<AmountLabel>{t("TRANSACTION.TRANSACTION_AMOUNT")}</AmountLabel>
						<Amount className="mt-1 text-lg font-semibold" ticker={ticker} value={amount} />
					</div>

					<div className="flex flex-col justify-center py-2 px-4 w-1/2 text-right">
						<AmountLabel>{t("TRANSACTION.TRANSACTION_FEE")}</AmountLabel>
						<Amount ticker={ticker} value={fee} className="mt-1 text-lg font-semibold" />
					</div>
				</div>

				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
					<div className="py-2 ml-px bg-theme-background text-theme-secondary-900 dark:text-theme-secondary-600">
						<Icon name="Plus" />
					</div>
				</div>
			</div>

			<div className="flex flex-col items-center py-6 rounded-b-lg border-t border-theme-secondary-300 justfiy-center bg-theme-secondary-100 dark:border-theme-secondary-800 dark:bg-theme-secondary-800">
				<AmountLabel>{t("TRANSACTION.TOTAL_AMOUNT")}</AmountLabel>
				<Amount ticker={ticker} value={total} className="text-2xl font-bold" />
			</div>
		</div>
	);
};
