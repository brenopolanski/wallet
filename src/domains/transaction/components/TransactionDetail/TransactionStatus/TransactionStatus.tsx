import { BigNumber } from "@payvo/helpers";
import { DTO } from "@payvo/profiles";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import React from "react";
import { useTranslation } from "react-i18next";

import { TransactionDetail } from "../TransactionDetail";

interface TransactionStatusProperties {
	transaction: DTO.ExtendedConfirmedTransactionData;
}

export const TransactionStatus = ({ transaction }: TransactionStatusProperties) => {
	const { t } = useTranslation();

	const renderStatus = (isConfirmed: boolean, confirmations: BigNumber) => {
		const confirmationStatusStyle = isConfirmed ? "text-theme-success-600" : "text-theme-warning-300";

		if (isConfirmed) {
			return (
				<div className="flex items-center space-x-2">
					<Icon name="CircleCheckMark" className={confirmationStatusStyle} size="lg" />
					<Tooltip
						disabled={!confirmations.toNumber()}
						content={t("TRANSACTION.CONFIRMATIONS_COUNT", { count: confirmations.toNumber() })}
					>
						<span>{t("TRANSACTION.CONFIRMED")}</span>
					</Tooltip>
				</div>
			);
		}

		return (
			<div className="flex items-center space-x-2">
				<Icon name="Clock" className={confirmationStatusStyle} size="lg" />
				<span>{t("TRANSACTION.NOT_YET_CONFIRMED")}</span>
			</div>
		);
	};

	return (
		<TransactionDetail label={t("TRANSACTION.STATUS")}>
			{renderStatus(transaction.isConfirmed(), transaction.confirmations())}
		</TransactionDetail>
	);
};
