import { translations } from "domains/transaction/i18n";
import React from "react";
import { render } from "utils/testing-library";

import { TransactionType } from "./TransactionType";

describe("TransactionType", () => {
	it("should render", () => {
		const { container } = render(<TransactionType type="multiPayment" />);

		expect(container).toHaveTextContent("multipayment.svg");
		expect(container).toHaveTextContent(translations.TRANSACTION_TYPES.MULTI_PAYMENT);

		expect(container).toMatchSnapshot();
	});
});
