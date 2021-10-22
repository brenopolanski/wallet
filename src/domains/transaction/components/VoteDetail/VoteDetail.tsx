import { Contracts } from "@payvo/profiles";
import { Modal } from "app/components/Modal";
import { useEnvironmentContext } from "app/contexts";
import {
	TransactionExplorerLink,
	TransactionFee,
	TransactionSender,
	TransactionStatus,
	TransactionTimestamp,
	TransactionVotes,
} from "domains/transaction/components/TransactionDetail";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { TransactionDetailProperties } from "../TransactionDetailModal/TransactionDetailModal.models";

export const VoteDetail = ({ isOpen, transaction, onClose }: TransactionDetailProperties) => {
	const { t } = useTranslation();
	const { env } = useEnvironmentContext();

	const wallet = useMemo(() => transaction.wallet(), [transaction]);

	const [isLoadingDelegates, setIsLoadingDelegates] = useState(true);
	const [delegates, setDelegates] = useState<{
		votes: Contracts.IReadOnlyWallet[];
		unvotes: Contracts.IReadOnlyWallet[];
	}>({
		unvotes: [],
		votes: [],
	});

	useEffect(() => {
		const syncDelegates = () => {
			setIsLoadingDelegates(true);

			setDelegates({
				unvotes: env.delegates().map(wallet, transaction.unvotes()),
				votes: env.delegates().map(wallet, transaction.votes()),
			});

			setIsLoadingDelegates(false);
		};

		syncDelegates();

		return () => {
			setIsLoadingDelegates(false);
			setDelegates({ unvotes: [], votes: [] });
		};
	}, [env, wallet, transaction, isOpen]);

	return (
		<Modal title={t("TRANSACTION.MODAL_VOTE_DETAIL.TITLE")} isOpen={isOpen} onClose={onClose}>
			<TransactionExplorerLink transaction={transaction} />

			<TransactionSender address={transaction.sender()} network={transaction.wallet().network()} border={false} />

			<TransactionVotes isLoading={isLoadingDelegates} {...delegates} />

			<TransactionFee currency={wallet.currency()} value={transaction.fee()} />

			<TransactionTimestamp timestamp={transaction.timestamp()} />

			<TransactionStatus transaction={transaction} />
		</Modal>
	);
};

VoteDetail.defaultProps = {
	isOpen: false,
};

VoteDetail.displayName = "VoteDetail";
