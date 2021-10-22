import { Enums } from "@payvo/sdk";
import { Modal } from "app/components/Modal";
import { RecipientList } from "domains/transaction/components/RecipientList";
import { RecipientListItem } from "domains/transaction/components/RecipientList/RecipientList.models";
import {
	TransactionDetail,
	TransactionExplorerLink,
	TransactionFee,
	TransactionSender,
	TransactionStatus,
	TransactionTimestamp,
} from "domains/transaction/components/TransactionDetail";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { TransactionDetailProperties } from "../TransactionDetailModal/TransactionDetailModal.models";

export const MultiSignatureRegistrationDetail = ({ isOpen, transaction, onClose }: TransactionDetailProperties) => {
	const { t } = useTranslation();

	const wallet = transaction.wallet();
	const [participants, setParticipants] = useState<RecipientListItem[]>([]);
	const [generatedAddress, setGeneratedAddress] = useState<string>();

	useEffect(() => {
		const fetchData = async () => {
			const addresses: RecipientListItem[] = [];
			for (const publicKey of transaction.publicKeys()) {
				const address = (await wallet.coin().address().fromPublicKey(publicKey)).address;
				addresses.push({ address });
			}

			setParticipants(addresses);

			if (!wallet.network().allows(Enums.FeatureFlag.AddressMultiSignature)) {
				setGeneratedAddress(transaction.sender());
				return;
			}

			const { address } = await wallet
				.coin()
				.address()
				.fromMultiSignature(transaction.min(), transaction.publicKeys());

			setGeneratedAddress(address);
		};

		fetchData();
	}, [wallet, transaction]);

	return (
		<Modal title={t("TRANSACTION.MODAL_MULTISIGNATURE_DETAIL.STEP_1.TITLE")} isOpen={isOpen} onClose={onClose}>
			<TransactionExplorerLink transaction={transaction} />

			<TransactionSender address={transaction.sender()} network={transaction.wallet().network()} border={false} />

			<TransactionFee currency={wallet.currency()} value={transaction.fee()} />

			<TransactionTimestamp timestamp={transaction.timestamp()} />

			<TransactionStatus transaction={transaction} />

			<TransactionDetail label={t("TRANSACTION.MULTISIGNATURE.PARTICIPANTS")} paddingPosition="top">
				<RecipientList showAmount={false} variant="condensed" recipients={participants} isEditable={false} />
			</TransactionDetail>

			<TransactionDetail label={t("TRANSACTION.MULTISIGNATURE.MIN_SIGNATURES")}>
				{transaction.min()} / {transaction.publicKeys().length}
			</TransactionDetail>

			{generatedAddress && (
				<TransactionDetail label={t("TRANSACTION.MULTISIGNATURE.GENERATED_ADDRESS")} paddingPosition="top">
					<RecipientList
						showAmount={false}
						variant="condensed"
						recipients={[{ address: generatedAddress }]}
						isEditable={false}
					/>
				</TransactionDetail>
			)}
		</Modal>
	);
};

MultiSignatureRegistrationDetail.defaultProps = {
	isOpen: false,
};

MultiSignatureRegistrationDetail.displayName = "MultiSignatureRegistrationDetail";
