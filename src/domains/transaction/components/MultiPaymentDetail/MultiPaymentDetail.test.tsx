import React from "react";
import { Route } from "react-router-dom";
import { TransactionFixture } from "tests/fixtures/transactions";
import { act, fireEvent, getDefaultProfileId, render, renderWithRouter, screen } from "utils/testing-library";

import { translations } from "../../i18n";
import { MultiPaymentDetail } from "./MultiPaymentDetail";

const fixtureProfileId = getDefaultProfileId();

describe("MultiPaymentDetail", () => {
	it("should not render if not open", () => {
		const { asFragment } = render(
			<MultiPaymentDetail
				isOpen={false}
				transaction={{
					...TransactionFixture,
					blockId: () => "adsad12312xsd1w312e1s13203e12",
				}}
			/>,
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<MultiPaymentDetail
					isOpen={true}
					transaction={{
						...TransactionFixture,
						blockId: () => "adsad12312xsd1w312e1s13203e12",
					}}
				/>
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}`],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with recipients", () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<MultiPaymentDetail
					isOpen={true}
					transaction={{
						...TransactionFixture,
						blockId: () => "adsad12312xsd1w312e1s13203e12",
						isConfirmed: () => true,
						recipients: () => [
							{
								address: "adsad12312xsd1w312e1s13203e12",
								amount: 200,
							},
							{
								address: "adsad12312xsd1w312e1s13203e13",
								amount: 1990,
							},
							{
								address: "adsad12312xsd1w312e1s13203e14",
								amount: 1990,
							},
						],
					}}
				/>
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}`],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);
		expect(screen.getByTestId("MultiPaymentRecipients")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render hint icon with tooltip when it's a returned transaction", () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId">
				<MultiPaymentDetail
					isOpen={true}
					transaction={{
						...TransactionFixture,
						blockId: () => "adsad12312xsd1w312e1s13203e12",
						isConfirmed: () => true,
						isReturn: () => true,
						recipients: () => [
							{
								address: "adsad12312xsd1w312e1s13203e12",
								amount: 200,
							},
							{
								address: TransactionFixture.sender(),
								amount: 99,
							},
							{
								address: "adsad12312xsd1w312e1s13203e14",
								amount: 1990,
							},
						],
					}}
				/>
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}`],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);

		expect(screen.getByTestId("AmountLabel__hint")).toBeInTheDocument();

		act(() => {
			fireEvent.mouseEnter(screen.getByTestId("AmountLabel__hint"));
		});

		expect(screen.getByText("Including 99 ARK sent to itself")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});
});
