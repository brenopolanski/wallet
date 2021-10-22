import { Contracts } from "@payvo/profiles";
import { Address } from "app/components/Address";
import { AmountCrypto } from "app/components/Amount";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { Header } from "app/components/Header";
import { Icon } from "app/components/Icon";
import { TransactionDetail, TransactionNetwork } from "domains/transaction/components/TransactionDetail";
import React from "react";
import { useTranslation } from "react-i18next";
import { assertWallet } from "utils/assertions";

export const ThirdStep = ({
	importedWallet,
	onClickEditAlias,
}: {
	importedWallet: Contracts.IReadWriteWallet | undefined;
	onClickEditAlias: () => void;
}) => {
	assertWallet(importedWallet);

	const { t } = useTranslation();

	const network = importedWallet.network();

	return (
		<section data-testid="ImportWallet__third-step">
			<Header
				title={t("WALLETS.PAGE_IMPORT_WALLET.PROCESS_COMPLETED_STEP.TITLE")}
				subtitle={t("WALLETS.PAGE_IMPORT_WALLET.PROCESS_COMPLETED_STEP.SUBTITLE")}
			/>

			<TransactionNetwork network={network} className="mt-2" border={false} />

			<TransactionDetail
				label={t("COMMON.ADDRESS")}
				extra={<Avatar size="lg" address={importedWallet.address()} />}
			>
				<Address address={importedWallet.address()} />
			</TransactionDetail>

			<TransactionDetail label={t("COMMON.BALANCE")}>
				<AmountCrypto value={importedWallet.balance()} ticker={network.ticker()} />
			</TransactionDetail>

			<TransactionDetail
				label={t("WALLETS.WALLET_NAME")}
				paddingPosition="top"
				extra={
					<Button
						data-testid="ImportWallet__edit-alias"
						type="button"
						variant="secondary"
						onClick={onClickEditAlias}
					>
						<Icon name="Pencil" />
					</Button>
				}
			>
				{importedWallet.alias()}
			</TransactionDetail>
		</section>
	);
};
