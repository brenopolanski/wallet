import { translations } from "domains/transaction/i18n";
import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { TransactionAmount } from "./TransactionAmount";

describe("TransactionAmount", () => {
	it("should render", () => {
		const { container } = render(<TransactionAmount amount={1} currency="DARK" />);

		expect(container).toMatchSnapshot();
	});

	it("should render currency amount", () => {
		const { container } = render(<TransactionAmount amount={1} currency="DARK" />);

		expect(container).toHaveTextContent("1 DARK");
		expect(container).toMatchSnapshot();
	});

	it("should render converted currency amount", () => {
		const { container } = render(
			<TransactionAmount amount={1} convertedAmount={1} currency="DARK" exchangeCurrency="ARK" />,
		);

		expect(container).toHaveTextContent("1 DARK");
		expect(container).toHaveTextContent("1 ARK");
	});

	it.each([false, true])("should render label for multiple recipients", (isMultiPayment) => {
		const { container } = render(<TransactionAmount amount={1} currency="DARK" isTotalAmount={isMultiPayment} />);

		expect(container).toHaveTextContent(isMultiPayment ? translations.TOTAL_AMOUNT : translations.AMOUNT);
		expect(container).toMatchSnapshot();
	});

	it.each(["Sent", "Received"])("should render '%s' icon", (type) => {
		const { container } = render(<TransactionAmount amount={1} currency="DARK" isSent={type === "Sent"} />);

		expect(container).toHaveTextContent(`${type.toLowerCase()}.svg`);
	});

	it.each(["Sent", "Received"])("should render info indicator for '%s'", (type) => {
		render(
			<TransactionAmount amount={2} returnedAmount={1} isTotalAmount currency="DARK" isSent={type === "Sent"} />,
		);

		expect(screen.getByTestId("AmountLabel__hint")).toBeInTheDocument();
		expect(screen.getByText("hint-small.svg")).toBeInTheDocument();

		fireEvent.mouseEnter(screen.getByTestId("AmountLabel__hint"));

		expect(screen.getByText("Including 1 DARK sent to itself")).toBeInTheDocument();
	});
});
