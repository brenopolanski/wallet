// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/sdk-profiles/distribution/read-only-wallet";
import { translations } from "domains/transaction/i18n";
import React from "react";
import { TransactionFixture } from "tests/fixtures/transactions";
import { env, render } from "utils/testing-library";

import { TransactionRowRecipientLabel } from "./TransactionRowRecipientLabel";

describe("TransactionRowRecipientLabel", () => {
	it("should show address", () => {
		const { getByTestId } = render(<TransactionRowRecipientLabel transaction={TransactionFixture} />);

		expect(getByTestId("Address__address")).toHaveTextContent("D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD");
	});

	it("should show label", () => {
		const { getByText } = render(
			<TransactionRowRecipientLabel transaction={{ ...TransactionFixture, type: () => "secondSignature" }} />,
		);

		expect(getByText(translations.TRANSACTION_TYPES.SECOND_SIGNATURE)).toBeInTheDocument();
	});

	it("should show a multipayment label", () => {
		const { getByText } = render(
			<TransactionRowRecipientLabel
				transaction={{
					...TransactionFixture,
					isMultiPayment: () => true,
					isTransfer: () => false,
					type: () => "multiPayment",
				}}
			/>,
		);

		expect(getByText(translations.TRANSACTION_TYPES.MULTI_PAYMENT)).toBeInTheDocument();
	});

	it("should show a magistrate label", () => {
		const { getByText } = render(
			<TransactionRowRecipientLabel
				transaction={{
					...TransactionFixture,
					type: () => "magistrate",
				}}
			/>,
		);

		expect(getByText(translations.TRANSACTION_TYPES.MAGISTRATE)).toBeInTheDocument();
	});

	describe("Votes", () => {
		jest.spyOn(env.delegates(), "map").mockImplementation((wallet, votes) =>
			votes.map(
				(vote: string, index: number) =>
					// @ts-ignore
					new ReadOnlyWallet({
						address: vote,
						username: `delegate-${index}`,
					}),
			),
		);

		it("should show a vote label", () => {
			const { getByTestId } = render(
				<TransactionRowRecipientLabel
					transaction={{
						...TransactionFixture,
						isTransfer: () => false,
						isVote: () => true,
						type: () => "vote",
						votes: () => ["+vote"],
					}}
				/>,
			);

			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent(translations.TRANSACTION_TYPES.VOTE);
			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent("delegate-0");
		});

		it("should show a vote label with counter", () => {
			const { getByTestId } = render(
				<TransactionRowRecipientLabel
					transaction={{
						...TransactionFixture,
						isTransfer: () => false,
						isVote: () => true,
						type: () => "vote",
						votes: () => ["+vote-1", "+vote-2"],
					}}
				/>,
			);

			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent(translations.TRANSACTION_TYPES.VOTE);
			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent("delegate-0");
			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent("+1");
		});

		it("should show a unvote label", () => {
			const { getByTestId } = render(
				<TransactionRowRecipientLabel
					transaction={{
						...TransactionFixture,
						isTransfer: () => false,
						isUnvote: () => true,
						type: () => "unvote",
						unvotes: () => ["-vote"],
					}}
				/>,
			);

			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent(translations.TRANSACTION_TYPES.UNVOTE);
			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent("delegate-0");
		});

		it("should show a vote label with counter if there are multiple votes", () => {
			const { getByTestId } = render(
				<TransactionRowRecipientLabel
					transaction={{
						...TransactionFixture,
						isTransfer: () => false,
						isUnvote: () => true,
						type: () => "unvote",
						unvotes: () => ["-vote", "-vote-2"],
					}}
				/>,
			);

			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent(translations.TRANSACTION_TYPES.UNVOTE);
			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent("delegate-0");
			expect(getByTestId("TransactionRowVoteLabel")).toHaveTextContent("+1");
		});

		it("should show a vote combination label", () => {
			const { getByTestId } = render(
				<TransactionRowRecipientLabel
					transaction={{
						...TransactionFixture,
						isTransfer: () => false,
						isUnvote: () => true,
						isVote: () => true,
						isVoteCombination: () => true,
						type: () => "voteCombination",
						unvotes: () => ["-vote"],
						votes: () => ["-vote"],
					}}
				/>,
			);

			expect(getByTestId("TransactionRowVoteCombinationLabel")).toHaveTextContent(
				translations.TRANSACTION_TYPES.VOTE,
			);
			expect(getByTestId("TransactionRowVoteCombinationLabel")).toHaveTextContent(
				translations.TRANSACTION_TYPES.UNVOTE,
			);
		});

		it("should show a vote combination label with counter", () => {
			const { getByTestId } = render(
				<TransactionRowRecipientLabel
					transaction={{
						...TransactionFixture,
						isTransfer: () => false,
						isUnvote: () => true,
						isVote: () => true,
						isVoteCombination: () => true,
						type: () => "voteCombination",
						unvotes: () => ["-vote-1", "-vote-2"],
						votes: () => ["+vote-1", "+vote-2"],
					}}
				/>,
			);

			expect(getByTestId("TransactionRowVoteCombinationLabel")).toHaveTextContent(
				`${translations.TRANSACTION_TYPES.VOTE}2`,
			);
			expect(getByTestId("TransactionRowVoteCombinationLabel")).toHaveTextContent(
				`${translations.TRANSACTION_TYPES.UNVOTE}2`,
			);
		});
	});
});
