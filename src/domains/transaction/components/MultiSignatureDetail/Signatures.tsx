import { Contracts, DTO } from "@payvo/sdk-profiles";
import { Avatar } from "app/components/Avatar";
import { Badge } from "app/components/Badge";
import { Tooltip } from "app/components/Tooltip";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { getMultiSignatureInfo } from "./MultiSignatureDetail.helpers";

const WaitingBadge = () => {
	const { t } = useTranslation();

	return (
		<Tooltip content={t("COMMON.AWAITING_SIGNATURE")}>
			<Badge
				data-testid="Signatures__waiting-badge"
				className="dark:text-white bg-theme-danger-100 text-theme-danger-400 dark:bg-theme-danger-400"
				icon="ClockSmall"
			/>
		</Tooltip>
	);
};

const SignedBadge = () => {
	const { t } = useTranslation();

	return (
		<Tooltip content={t("COMMON.SIGNED")}>
			<Badge
				data-testid="Signatures__signed-badge"
				className="dark:text-white bg-theme-success-200 text-theme-success-500 dark:bg-theme-success-600"
				icon="CheckmarkSmall"
			/>
		</Tooltip>
	);
};

const ParticipantStatus = ({
	transaction,
	publicKey,
	wallet,
}: {
	transaction: DTO.ExtendedSignedTransactionData;
	publicKey: string;
	wallet: Contracts.IReadWriteWallet;
}) => {
	const isAwaitingSignature = useMemo(() => {
		try {
			if (
				!wallet.transaction().isAwaitingOurSignature(transaction.id()) &&
				!wallet.transaction().isAwaitingOtherSignatures(transaction.id())
			) {
				return false;
			}

			return wallet.transaction().isAwaitingSignatureByPublicKey(transaction.id(), publicKey);
		} catch {
			return false;
		}
	}, [wallet, transaction, publicKey]);

	const [address, setAddress] = useState("");

	useEffect(() => {
		const fetchData = async () => {
			const { address } = await wallet.coin().address().fromPublicKey(publicKey);
			setAddress(address);
		};
		fetchData();
	}, [wallet, publicKey]);

	return (
		<div data-testid="Signatures__participant-status" className="relative">
			<Tooltip content={address}>
				<div>
					<Avatar address={address} size="lg" />
				</div>
			</Tooltip>

			{isAwaitingSignature ? <WaitingBadge /> : <SignedBadge />}
		</div>
	);
};

export const Signatures = ({
	transaction,
	wallet,
}: {
	transaction: DTO.ExtendedSignedTransactionData;
	wallet: Contracts.IReadWriteWallet;
}) => {
	const { t } = useTranslation();

	const { publicKeys: participantPublicKeys } = getMultiSignatureInfo(transaction);
	const publicKeys = participantPublicKeys.filter((pubKey) => pubKey !== wallet.publicKey());

	return (
		<div data-testid="Signatures">
			<h3>{t("TRANSACTION.SIGNATURES")}</h3>

			<div className="flex">
				<div>
					<div className="mb-2 text-sm font-semibold text-theme-secondary-500">{t("COMMON.YOU")}</div>

					<div className="pr-6 mr-2 border-r border-theme-secondary-300 dark:border-theme-secondary-800">
						<ParticipantStatus transaction={transaction} publicKey={wallet.publicKey()!} wallet={wallet} />
					</div>
				</div>

				<div>
					<div className="mb-2 ml-2 text-sm font-semibold text-theme-secondary-500">{t("COMMON.OTHER")}</div>
					<div className="flex ml-2 space-x-4">
						{publicKeys.map((publicKey) => (
							<ParticipantStatus
								key={publicKey}
								transaction={transaction}
								publicKey={publicKey}
								wallet={wallet}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
