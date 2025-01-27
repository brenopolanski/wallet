import { DTO } from "@payvo/sdk-profiles";
import { NotificationTransactionItem } from "app/components/Notifications";
import { Table } from "app/components/Table";
import {
	NotificationTransactionsProperties,
	NotificationTransactionsSkeleton,
} from "domains/transaction/components/TransactionTable/NotificationTransactionsTable";
import React from "react";
import { useTranslation } from "react-i18next";
import VisibilitySensor from "react-visibility-sensor";

export const NotificationTransactionsTable = ({
	profile,
	transactions,
	containmentRef,
	onClick,
	isLoading = true,
	onVisibilityChange,
}: NotificationTransactionsProperties) => {
	const { t } = useTranslation();

	if (isLoading) {
		return <NotificationTransactionsSkeleton />;
	}

	return (
		<div>
			<div className="space-y-2">
				<div className="text-base font-semibold text-theme-secondary-500">
					{t("COMMON.NOTIFICATIONS.TRANSACTIONS_TITLE")}
				</div>
				<VisibilitySensor
					onChange={(isVisible) => onVisibilityChange?.(isVisible)}
					scrollCheck
					delayedCall
					containment={containmentRef?.current}
				>
					<Table hideHeader columns={[{ Header: "-", className: "hidden" }]} data={transactions}>
						{(transaction: DTO.ExtendedConfirmedTransactionData) => (
							<NotificationTransactionItem
								transaction={transaction}
								profile={profile}
								containmentRef={containmentRef}
								onTransactionClick={onClick}
							/>
						)}
					</Table>
				</VisibilitySensor>
			</div>
		</div>
	);
};
