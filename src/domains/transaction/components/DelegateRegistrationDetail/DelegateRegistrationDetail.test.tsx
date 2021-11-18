import { translations } from "domains/transaction/i18n";
import React from "react";
import { Route } from "react-router-dom";
import { TransactionFixture } from "tests/fixtures/transactions";
import { getDefaultProfileId, render, screen } from "utils/testing-library";

import { DelegateRegistrationDetail } from "./DelegateRegistrationDetail";

const fixtureProfileId = getDefaultProfileId();

describe("DelegateRegistrationDetail", () => {
	it("should not render if not open", () => {
		const { asFragment } = render(
			<DelegateRegistrationDetail
				isOpen={false}
				transaction={{ ...TransactionFixture, username: () => "Ark Wallet" }}
			/>,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<DelegateRegistrationDetail
					isOpen={true}
					transaction={{ ...TransactionFixture, username: () => "Ark Wallet" }}
				/>
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}`],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_DELEGATE_REGISTRATION_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});
});
