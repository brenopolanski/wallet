import { translations } from "domains/transaction/i18n";
import React from "react";
import { render } from "utils/testing-library";

import { LedgerConfirmation } from "./LedgerConfirmation";

describe("LedgerConfirmation", () => {
	it("should render", () => {
		const { asFragment, getByTestId } = render(<LedgerConfirmation />);

		expect(getByTestId("LedgerConfirmation-description")).toHaveTextContent(
			translations.LEDGER_CONFIRMATION.DESCRIPTION,
		);
		expect(getByTestId("LedgerConfirmation-loading_message")).toHaveTextContent(
			translations.LEDGER_CONFIRMATION.LOADING_MESSAGE,
		);
		expect(asFragment()).toMatchSnapshot();
	});
});
