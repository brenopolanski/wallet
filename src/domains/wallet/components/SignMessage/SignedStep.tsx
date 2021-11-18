import { Services } from "@payvo/sdk";
import { Contracts as ProfileContracts } from "@payvo/sdk-profiles";
import { Address } from "app/components/Address";
import { Avatar } from "app/components/Avatar";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { TextArea } from "app/components/TextArea";
import { TransactionDetail } from "domains/transaction/components/TransactionDetail";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";

export const SignedStep = ({
	signedMessage,
	wallet,
}: {
	signedMessage: Services.SignedMessage;
	wallet: ProfileContracts.IReadWriteWallet;
}) => {
	const { t } = useTranslation();

	const messageReference = useRef();
	const walletAlias = wallet.alias();

	return (
		<section>
			<Header title={t("WALLETS.MODAL_SIGN_MESSAGE.SIGNED_STEP.TITLE")} />

			<TransactionDetail
				borderPosition="bottom"
				label={t("WALLETS.SIGNATORY")}
				extra={<Avatar size="lg" address={wallet.address()} />}
			>
				<Address walletName={walletAlias} address={wallet.address()} />
			</TransactionDetail>

			<TransactionDetail borderPosition="bottom" label={t("COMMON.MESSAGE")} className="text-lg break-all">
				{signedMessage.message}
			</TransactionDetail>

			<div className="pt-6">
				<FormField name="json-signature">
					<FormLabel label={t("COMMON.SIGNATURE")} />
					<TextArea
						className="py-4"
						name="signature"
						wrap="hard"
						ref={messageReference}
						defaultValue={JSON.stringify(signedMessage)}
						disabled
					/>
				</FormField>
			</div>
		</section>
	);
};
