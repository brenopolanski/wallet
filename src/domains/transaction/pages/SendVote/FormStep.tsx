import { Contracts as ProfilesContracts } from "@payvo/sdk-profiles";
import { FormField, FormLabel } from "app/components/Form";
import { Header } from "app/components/Header";
import { FeeField } from "domains/transaction/components/FeeField";
import {
	TransactionDetail,
	TransactionNetwork,
	TransactionSender,
} from "domains/transaction/components/TransactionDetail";
import { VoteList } from "domains/vote/components/VoteList";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { SendVoteStepProperties } from "./SendVote.models";

type FormStepProperties = {
	profile: ProfilesContracts.IProfile;
} & SendVoteStepProperties;

export const FormStep = ({ unvotes, votes, wallet, profile }: FormStepProperties) => {
	const { t } = useTranslation();

	const showFeeInput = useMemo(() => !wallet.network().chargesZeroFees(), [wallet]);

	const network = useMemo(() => wallet.network(), [wallet]);

	const feeTransactionData = useMemo(
		() => ({
			unvotes: unvotes.map((vote) => ({
				amount: vote.amount,
				id: vote.wallet?.governanceIdentifier(),
			})),
			votes: votes.map((vote) => ({
				amount: vote.amount,
				id: vote.wallet?.governanceIdentifier(),
			})),
		}),
		[unvotes, votes],
	);

	return (
		<section data-testid="SendVote__form-step">
			<Header
				title={t("TRANSACTION.PAGE_VOTE.FORM_STEP.TITLE")}
				subtitle={t("TRANSACTION.PAGE_VOTE.FORM_STEP.DESCRIPTION")}
			/>

			<TransactionNetwork network={wallet.network()} border={false} />

			<TransactionSender address={wallet.address()} network={wallet.network()} />

			{unvotes.length > 0 && (
				<TransactionDetail label={t("TRANSACTION.UNVOTES_COUNT", { count: unvotes.length })}>
					<VoteList votes={unvotes} currency={wallet.currency()} isNegativeAmount />
				</TransactionDetail>
			)}

			{votes.length > 0 && (
				<TransactionDetail label={t("TRANSACTION.VOTES_COUNT", { count: votes.length })}>
					<VoteList votes={votes} currency={wallet.currency()} />
				</TransactionDetail>
			)}

			{showFeeInput && (
				<TransactionDetail paddingPosition="top">
					<FormField name="fee" className="flex-1">
						<FormLabel label={t("TRANSACTION.TRANSACTION_FEE")} />
						<FeeField type="vote" data={feeTransactionData} network={network} profile={profile} />
					</FormField>
				</TransactionDetail>
			)}
		</section>
	);
};
