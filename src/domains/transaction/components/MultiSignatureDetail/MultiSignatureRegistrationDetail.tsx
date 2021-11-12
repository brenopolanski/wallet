import { Enums } from "@payvo/sdk";
import { Modal } from "app/components/Modal";
import { RecipientList } from "domains/transaction/components/RecipientList";
import { RecipientItem } from "domains/transaction/components/RecipientList/RecipientList.contracts";
import {
	TransactionDetail,
	TransactionExplorerLink,
	TransactionFee,
	TransactionSender,
	TransactionStatus,
	TransactionTimestamp,
} from "domains/transaction/components/TransactionDetail";
import { TransactionDetailProperties } from "domains/transaction/components/TransactionDetailModal/TransactionDetailModal.models";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const MultiSignatureRegistrationDetail: React.FC<TransactionDetailProperties> = ({
	isOpen,
	transaction,
	onClose,
}: TransactionDetailProperties) => {
	const { t } = useTranslation();

	const wallet = transaction.wallet();
	const [participants, setParticipants] = useState<RecipientItem[]>([]);
	const [generatedAddress, setGeneratedAddress] = useState<string>();

	useEffect(() => {
		const fetchData = async () => {
			const addresses: RecipientItem[] = [];
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
				.fromMultiSignature({ min: transaction.min(), publicKeys: transaction.publicKeys() });

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
				<RecipientList
					isEditable={false}
					recipients={participants}
					showAmount={false}
					showExchangeAmount={false}
					ticker={wallet.currency()}
					variant="condensed"
				/>
			</TransactionDetail>

			<TransactionDetail label={t("TRANSACTION.MULTISIGNATURE.MIN_SIGNATURES")}>
				{transaction.min()} / {transaction.publicKeys().length}
			</TransactionDetail>

			{generatedAddress && (
				<TransactionDetail label={t("TRANSACTION.MULTISIGNATURE.GENERATED_ADDRESS")} paddingPosition="top">
					<RecipientList
						isEditable={false}
						recipients={[{ address: generatedAddress }]}
						showAmount={false}
						showExchangeAmount={false}
						ticker={wallet.currency()}
						variant="condensed"
					/>
				</TransactionDetail>
			)}
		</Modal>
	);
};

MultiSignatureRegistrationDetail.displayName = "MultiSignatureRegistrationDetail";
