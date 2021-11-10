import { DTO } from "@payvo/profiles";
import { Clipboard } from "app/components/Clipboard";
import { Icon } from "app/components/Icon";
import { Link } from "app/components/Link";
import { TruncateMiddleDynamic } from "app/components/TruncateMiddleDynamic";
import {
	TransactionDetail,
	TransactionDetailProperties,
} from "domains/transaction/components/TransactionDetail/TransactionDetail";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";

type TransactionExplorerLinkProperties = {
	transaction: DTO.ExtendedConfirmedTransactionData | DTO.ExtendedSignedTransactionData;
} & TransactionDetailProperties;

export const TransactionExplorerLink = ({
	transaction,
	borderPosition = "bottom",
	...properties
}: TransactionExplorerLinkProperties) => {
	const { t } = useTranslation();

	const reference = useRef(null);

	return (
		<TransactionDetail label={t("TRANSACTION.ID")} borderPosition={borderPosition} {...properties}>
			<div className="flex overflow-hidden items-baseline space-x-3">
				<span ref={reference} className="overflow-hidden">
					<Link to={transaction.explorerLink()} isExternal>
						<TruncateMiddleDynamic value={transaction.id()} offset={22} parentRef={reference} />
					</Link>
				</span>

				<span className="flex text-theme-primary-300 dark:text-theme-secondary-600">
					<Clipboard variant="icon" data={transaction.id()}>
						<Icon name="Copy" />
					</Clipboard>
				</span>
			</div>
		</TransactionDetail>
	);
};
