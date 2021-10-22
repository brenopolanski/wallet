import { DTO } from "@payvo/profiles";
import { Circle } from "app/components/Circle";
import { Icon } from "app/components/Icon";
import { Tooltip } from "app/components/Tooltip";
import cn from "classnames";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TransactionRowRecipientIcon } from "./TransactionRowRecipientIcon";

interface Properties {
	type: string;
	isSent: boolean;
	isReturn?: boolean;
	address: string;
	isCompact: boolean;
}

export const BaseTransactionRowMode = ({ type, isSent, isReturn, address, isCompact }: Properties) => {
	const { t } = useTranslation();

	const iconSize = isCompact ? "xs" : "lg";

	const { modeIconName, tooltipContent, modeCircleStyle } = useMemo(() => {
		if (isReturn && (type === "transfer" || type === "multiPayment")) {
			return {
				modeCircleStyle: "border-theme-success-200 text-theme-success-600 dark:border-theme-success-600",
				modeIconName: "Return",
				tooltipContent: t("TRANSACTION.RETURN"),
			};
		}

		if (isSent) {
			return {
				modeCircleStyle: "border-theme-danger-100 text-theme-danger-400 dark:border-theme-danger-400",
				modeIconName: "Sent",
				tooltipContent: t("TRANSACTION.SENT"),
			};
		}

		return {
			modeCircleStyle: "border-theme-success-200 text-theme-success-600 dark:border-theme-success-600",
			modeIconName: "Received",
			tooltipContent: t("TRANSACTION.RECEIVED"),
		};
	}, [isSent, isReturn, t, type]);

	const shadowClasses =
		"ring-theme-background group-hover:ring-theme-secondary-100 group-hover:bg-theme-secondary-100 dark:group-hover:ring-black dark:group-hover:bg-black";

	return (
		<div
			data-testid="TransactionRowMode"
			className={cn("flex items-center", isCompact ? "space-x-2" : "-space-x-1")}
		>
			<Tooltip content={tooltipContent}>
				{isCompact ? (
					<span className={cn("w-5 h-5 flex items-center border-0", modeCircleStyle)}>
						<Icon name={modeIconName} size="lg" />
					</span>
				) : (
					<Circle size={iconSize} className={cn(shadowClasses, modeCircleStyle)}>
						<Icon name={modeIconName} size={iconSize} />
					</Circle>
				)}
			</Tooltip>

			<TransactionRowRecipientIcon recipient={address} type={type} isCompact={isCompact} />
		</div>
	);
};

export const TransactionRowMode = ({
	transaction,
	transactionType,
	isCompact,
}: {
	transaction: DTO.ExtendedConfirmedTransactionData;
	transactionType?: string;
	isCompact: boolean;
}) => (
	<BaseTransactionRowMode
		isCompact={isCompact}
		isSent={transaction.isSent()}
		isReturn={transaction.sender() === transaction.wallet().address() && transaction.isReturn()}
		type={transactionType || transaction.type()}
		address={transaction.sender()}
	/>
);
