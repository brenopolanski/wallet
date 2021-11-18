import { DTO } from "@payvo/sdk-profiles";
import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Circle } from "app/components/Circle";
import { Divider } from "app/components/Divider";
import { Icon } from "app/components/Icon";
import { Link } from "app/components/Link";
import { TransactionDetail } from "domains/transaction/components/TransactionDetail";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface MultiPaymentRecipientsProperties {
	transaction: DTO.ExtendedConfirmedTransactionData;
	recipients: {
		address: string;
		amount?: number;
		alias?: string;
		isDelegate?: boolean;
	}[];
}

export const MultiPaymentRecipients = ({ transaction, recipients }: MultiPaymentRecipientsProperties) => {
	const { t } = useTranslation();

	const recipient = useMemo(() => {
		if (transaction.isReturn()) {
			return recipients.find((recipient) => recipient.address === transaction.sender());
		}

		return recipients[0];
	}, [recipients, transaction]);

	const Label = (
		<div className="flex items-center space-x-4">
			<span>{t("TRANSACTION.RECIPIENTS_COUNT", { count: recipients.length })}</span>
			<Divider type="vertical" size="md" />
			<Link to={transaction.explorerLink()} isExternal>
				{t("TRANSACTION.VIEW_RECIPIENTS_LIST")}
			</Link>
		</div>
	);

	return (
		<TransactionDetail
			data-testid="MultiPaymentRecipients"
			label={Label}
			extra={
				<div className="flex items-center -space-x-1">
					{recipient?.isDelegate && (
						<Circle
							className="border-theme-text text-theme-text dark:border-theme-secondary-600 dark:text-theme-secondary-600"
							size="lg"
						>
							<Icon name="Delegate" size="lg" />
						</Circle>
					)}
					<Avatar address={recipient?.address} size="lg" />
				</div>
			}
		>
			<Address address={recipient?.address} walletName={recipient?.alias} />
		</TransactionDetail>
	);
};
