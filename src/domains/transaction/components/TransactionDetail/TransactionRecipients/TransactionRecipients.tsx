import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Circle } from "app/components/Circle";
import { Icon } from "app/components/Icon";
import { RecipientList } from "domains/transaction/components/RecipientList";
import { RecipientItem } from "domains/transaction/components/RecipientList/RecipientList.contracts";
import {
	TransactionDetail,
	TransactionDetailProperties,
} from "domains/transaction/components/TransactionDetail/TransactionDetail";
import React from "react";
import { useTranslation } from "react-i18next";

type TransactionRecipientsProperties = {
	currency: string;
	recipients: RecipientItem[];
} & TransactionDetailProperties;

export const TransactionRecipients: React.FC<TransactionRecipientsProperties> = ({
	currency,
	recipients,
	...properties
}: TransactionRecipientsProperties) => {
	const { t } = useTranslation();

	if (recipients.length === 0) {
		return null;
	}

	if (recipients.length === 1) {
		const { address, alias, isDelegate } = recipients[0];

		return (
			<TransactionDetail
				data-testid="TransactionRecipients"
				label={t("TRANSACTION.RECIPIENT")}
				extra={
					<div className="flex items-center -space-x-1">
						{isDelegate && (
							<Circle
								className="border-theme-text text-theme-text dark:border-theme-secondary-600 dark:text-theme-secondary-600"
								size="lg"
							>
								<Icon name="Delegate" size="lg" />
							</Circle>
						)}
						<Avatar address={address} size="lg" />
					</div>
				}
				{...properties}
			>
				<Address address={address} walletName={alias} />
			</TransactionDetail>
		);
	}

	return (
		<TransactionDetail
			data-testid="TransactionRecipients"
			label={t("TRANSACTION.RECIPIENTS_COUNT", { count: recipients.length })}
			{...properties}
		>
			<RecipientList
				isEditable={false}
				recipients={recipients}
				showAmount
				showExchangeAmount={false}
				ticker={currency}
				variant="condensed"
			/>
		</TransactionDetail>
	);
};
