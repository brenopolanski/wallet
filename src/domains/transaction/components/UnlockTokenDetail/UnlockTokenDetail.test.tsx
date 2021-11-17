import { screen } from "@testing-library/react";
import { translations } from "domains/transaction/i18n";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import { TransactionFixture } from "tests/fixtures/transactions";
import { getDefaultProfileId, render } from "utils/testing-library";

import { UnlockTokenDetail } from "./UnlockTokenDetail";

const history = createMemoryHistory();

const transactionFixture = {
	...TransactionFixture,
	wallet: () => ({
		...TransactionFixture.wallet(),
		currency: () => "LSK",
	}),
};

describe("UnlockTokenDetail", () => {
	const dashboardUrl = `/profiles/${getDefaultProfileId()}/dashboard`;

	beforeEach(() => {
		history.push(dashboardUrl);
	});

	it("should not render if not open", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<UnlockTokenDetail isOpen={false} transaction={transactionFixture} onClose={jest.fn()} />,
			</Route>,
			{
				history,
				routes: [dashboardUrl],
			},
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId/dashboard">
				<UnlockTokenDetail isOpen={true} transaction={transactionFixture} onClose={jest.fn()} />,
			</Route>,
			{
				history,
				routes: [dashboardUrl],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.TRANSACTION_TYPES.UNLOCK_TOKEN);
		expect(asFragment()).toMatchSnapshot();
	});
});
