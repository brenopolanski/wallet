import { translations } from "domains/transaction/i18n";
import React from "react";
import { render, screen } from "utils/testing-library";

import { LedgerConfirmation } from "./LedgerConfirmation";

describe("LedgerConfirmation", () => {
	it("should render", () => {
		const { asFragment } = render(<LedgerConfirmation />);

		expect(screen.getByTestId("LedgerConfirmation-description")).toHaveTextContent(
			translations.LEDGER_CONFIRMATION.DESCRIPTION,
		);
		expect(screen.getByTestId("LedgerConfirmation-loading_message")).toHaveTextContent(
			translations.LEDGER_CONFIRMATION.LOADING_MESSAGE,
		);
		expect(asFragment()).toMatchSnapshot();
	});
});
