import React from "react";
import { Route } from "react-router-dom";
import { TransactionFixture } from "tests/fixtures/transactions";
import { getDefaultProfileId, renderWithRouter, screen } from "utils/testing-library";

import { translations } from "../../i18n";
import { TransferDetail } from "./TransferDetail";

const fixtureProfileId = getDefaultProfileId();

describe("TransferDetail", () => {
	it("should not render if not open", () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<TransferDetail
					isOpen={false}
					transaction={{ ...TransactionFixture, blockId: () => "adsad12312xsd1w312e1s13203e12" }}
					ticker="BTC"
				/>
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}/dashboard`],
			},
		);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a modal", () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<TransferDetail
					isOpen={true}
					transaction={{ ...TransactionFixture, blockId: () => "adsad12312xsd1w312e1s13203e12" }}
					ticker="BTC"
				/>
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}/dashboard`],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render as not is sent", () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<TransferDetail
					isOpen={true}
					transaction={{
						...TransactionFixture,
						blockId: () => "adsad12312xsd1w312e1s13203e12",
						isSent: () => false,
					}}
					ticker="BTC"
				/>
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}/dashboard`],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with wallet alias", () => {
		const { asFragment } = renderWithRouter(
			<Route path="/profiles/:profileId/dashboard">
				<TransferDetail
					isOpen={true}
					transaction={{
						...TransactionFixture,
						blockId: () => "adsad12312xsd1w312e1s13203e12",
						isSent: () => false,
					}}
					walletAlias="D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD"
					ticker="BTC"
				/>
			</Route>,
			{
				routes: [`/profiles/${fixtureProfileId}/dashboard`],
			},
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent(translations.MODAL_TRANSFER_DETAIL.TITLE);
		expect(asFragment()).toMatchSnapshot();
	});
});
