import { Contracts, DTO } from "@payvo/sdk-profiles";
import { Address } from "app/components/Address";
import { useWalletAlias } from "app/hooks/use-wallet-alias";
import React, { useMemo } from "react";

import { TransactionRowMode } from "./TransactionRowMode";

interface Properties {
	transaction: DTO.ExtendedConfirmedTransactionData;
	profile: Contracts.IProfile;
	isCompact: boolean;
}

export const TransactionRowSender = ({ transaction, profile, isCompact }: Properties) => {
	const { getWalletAlias } = useWalletAlias();

	const { alias } = useMemo(
		() =>
			getWalletAlias({
				address: transaction.sender(),
				network: transaction.wallet().network(),
				profile,
			}),
		[profile, getWalletAlias, transaction],
	);

	return (
		<>
			<TransactionRowMode transaction={transaction} transactionType="transfer" isCompact={isCompact} />
			<div className="w-0 flex-1">
				<Address walletName={alias} address={transaction.sender()} />
			</div>
		</>
	);
};
