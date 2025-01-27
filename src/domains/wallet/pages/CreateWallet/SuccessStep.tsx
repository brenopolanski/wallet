import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { Button } from "app/components/Button";
import { Header } from "app/components/Header";
import { Icon } from "app/components/Icon";
import { TransactionDetail, TransactionNetwork } from "domains/transaction/components/TransactionDetail";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { assertNetwork, assertWallet } from "utils/assertions";

export const SuccessStep = ({ onClickEditAlias }: { onClickEditAlias: () => void }) => {
	const { t } = useTranslation();

	const { getValues, watch } = useFormContext();

	// getValues does not get the value of `defaultValues` on first render
	const [defaultNetwork] = useState(() => watch("network"));
	const network = getValues("network") || defaultNetwork;

	const [defaultWallet] = useState(() => watch("wallet"));
	const wallet = getValues("wallet") || defaultWallet;

	assertNetwork(network);
	assertWallet(wallet);

	return (
		<section data-testid="CreateWallet__SuccessStep">
			<Header
				title={t("WALLETS.PAGE_CREATE_WALLET.PROCESS_COMPLETED_STEP.TITLE")}
				subtitle={t("WALLETS.PAGE_CREATE_WALLET.PROCESS_COMPLETED_STEP.SUBTITLE")}
			/>

			<TransactionNetwork network={network} border={false} />

			<TransactionDetail
				label={t("COMMON.ADDRESS")}
				borderPosition="both"
				extra={<Avatar size="lg" address={wallet.address()} />}
			>
				<Address address={wallet.address()} />
			</TransactionDetail>

			<TransactionDetail
				label={t("WALLETS.WALLET_NAME")}
				paddingPosition="top"
				extra={
					<Button
						data-testid="CreateWallet__edit-alias"
						type="button"
						variant="secondary"
						onClick={onClickEditAlias}
					>
						<Icon name="Pencil" />
					</Button>
				}
			>
				{wallet.alias()}
			</TransactionDetail>
		</section>
	);
};
