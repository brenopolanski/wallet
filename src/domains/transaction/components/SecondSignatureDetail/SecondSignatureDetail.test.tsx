import { translations } from "domains/transaction/i18n";
import React from "react";
import { Route } from "react-router-dom";
import { TransactionFixture } from "tests/fixtures/transactions";
import { getDefaultProfileId, render, screen } from "utils/testing-library";

import { SecondSignatureDetail } from "./SecondSignatureDetail";

const fixtureProfileId = getDefaultProfileId();

describe("SecondSignatureDetail", () => {
	it("should not render if not open", () => {
		const { asFragment } = render(
			<SecondSignatureDetail isOpen={false} transaction={TransactionFixture} />,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<SecondSignatureDetail isOpen={true} transaction={TransactionFixture} />
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}`],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SECOND_SIGNATURE_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal without a wallet alias", () => {
		const { asFragment } = render(
			<Route path="/profiles/:profileId">
				<SecondSignatureDetail
					isOpen={true}
					transaction={{
						...TransactionFixture,
						wallet: () => ({
							...TransactionFixture.wallet(),
							alias: () => undefined,
						}),
					}}
				/>
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}`],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_SECOND_SIGNATURE_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});
});
