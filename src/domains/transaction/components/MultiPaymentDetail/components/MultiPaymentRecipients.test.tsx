import { translations } from "domains/transaction/i18n";
import React from "react";
import { TransactionFixture } from "tests/fixtures/transactions";
import { render, screen } from "utils/testing-library";

import { MultiPaymentRecipients } from "./MultiPaymentRecipients";

describe("MultiPaymentRecipients", () => {
	it("should render recipients", () => {
		const recipients = [
			{
				address: "test-address1",
			},
			{
				address: "test-address2",
			},
		];

		const { container } = render(
			<MultiPaymentRecipients transaction={TransactionFixture} recipients={recipients} />,
		);

		expect(screen.getByTestId("MultiPaymentRecipients")).toBeInTheDocument();
		expect(screen.getByText(`${translations.RECIPIENTS} (2)`)).toBeInTheDocument();
		expect(screen.getByText(translations.VIEW_RECIPIENTS_LIST)).toBeInTheDocument();
		expect(screen.getByText(recipients[0].address)).toBeInTheDocument();

		expect(container).toMatchSnapshot();
	});

	it("should show recipient with alias", () => {
		const recipients = [
			{
				address: "test-address1",
				alias: "alias-address1",
			},
			{
				address: "test-address2",
				alias: "alias-address2",
			},
		];

		render(<MultiPaymentRecipients transaction={TransactionFixture} recipients={recipients} />);

		expect(screen.getByText(recipients[0].alias)).toBeInTheDocument();
		expect(screen.getByText(recipients[0].address)).toBeInTheDocument();
	});

	it("should render the delegate icon if isDelegate", () => {
		const recipients = [
			{
				address: "test-address1",
				isDelegate: true,
			},
			{
				address: "test-address2",
			},
		];

		render(<MultiPaymentRecipients transaction={TransactionFixture} recipients={recipients} />);

		expect(screen.getByText("delegate-registration.svg")).toBeInTheDocument();
	});

	it("should show the sender address if it's a returned transaction", () => {
		const { address: senderAddress, alias: senderAlias } = TransactionFixture.wallet();

		const recipients = [
			{
				address: "test-address1",
				isDelegate: true,
			},
			{
				address: senderAddress(),
				alias: senderAlias(),
			},
		];

		render(
			<MultiPaymentRecipients
				transaction={{ ...TransactionFixture, isReturn: () => true }}
				recipients={recipients}
			/>,
		);

		expect(screen.getByText(senderAddress())).toBeInTheDocument();
		expect(screen.getByText(senderAlias())).toBeInTheDocument();
	});
});
