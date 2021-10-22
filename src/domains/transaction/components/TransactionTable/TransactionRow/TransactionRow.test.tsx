import { Contracts } from "@payvo/profiles";
import * as useRandomNumberHook from "app/hooks/use-random-number";
import { translations as commonTranslations } from "app/i18n/common/i18n";
import React from "react";
import { TransactionFixture } from "tests/fixtures/transactions";
import { env, getDefaultProfileId, renderWithRouter, screen } from "utils/testing-library";

import { TransactionRow } from "./TransactionRow";

let profile: Contracts.IProfile;

describe("TransactionRow", () => {
	const fixture = {
		...TransactionFixture,
		wallet: () => ({
			...TransactionFixture.wallet(),
			currency: () => "DARK",
		}),
	};

	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());

		jest.spyOn(useRandomNumberHook, "useRandomNumber").mockImplementation(() => 1);
	});

	afterAll(() => {
		useRandomNumberHook.useRandomNumber.mockRestore();
	});

	it("should render", () => {
		const { asFragment } = renderWithRouter(
			<table>
				<tbody>
					<TransactionRow transaction={fixture as any} profile={profile} />
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();
		expect(screen.getAllByRole("cell")).toHaveLength(6);
		expect(screen.getByTestId("TransactionRow__ID")).toBeInTheDocument();
		expect(screen.getByTestId("TransactionRow__timestamp")).toBeInTheDocument();
		expect(screen.getByTestId("TransactionRowMode")).toBeInTheDocument();
		expect(screen.getAllByTestId("Address__address")).toHaveLength(2);
		expect(screen.getByTestId("AmountCrypto")).toBeInTheDocument();
	});

	it("should render skeleton", () => {
		const { asFragment } = renderWithRouter(
			<table>
				<tbody>
					<TransactionRow profile={profile} isLoading />
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render compact skeleton", () => {
		profile.settings().set(Contracts.ProfileSetting.UseExpandedTables, true);

		const { asFragment } = renderWithRouter(
			<table>
				<tbody>
					<TransactionRow profile={profile} isLoading />
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();

		profile.settings().set(Contracts.ProfileSetting.UseExpandedTables, false);
	});

	it("should render with currency", () => {
		const { asFragment } = renderWithRouter(
			<table>
				<tbody>
					<TransactionRow
						transaction={
							{
								...fixture,
								wallet: () => ({
									...fixture.wallet(),
									currency: () => "BTC",
									isLedger: () => false,
									network: () => ({ isTest: () => false }),
								}),
							} as any
						}
						exchangeCurrency="BTC"
						profile={profile}
					/>
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();
		expect(screen.getAllByTestId("AmountCrypto")).toHaveLength(2);
		expect(() => screen.getByText(commonTranslations.NOT_AVAILABLE)).toThrow();
	});

	it("should omit the currency for transactions from test networks", () => {
		const { asFragment } = renderWithRouter(
			<table>
				<tbody>
					<TransactionRow
						transaction={
							{
								...fixture,
								wallet: () => ({
									...fixture.wallet(),
									currency: () => "BTC",
									isLedger: () => false,
									network: () => ({ isTest: () => true }),
								}),
							} as any
						}
						exchangeCurrency="BTC"
						profile={profile}
					/>
				</tbody>
			</table>,
		);

		expect(asFragment()).toMatchSnapshot();
		expect(screen.getAllByTestId("AmountCrypto")).toHaveLength(1);
		expect(screen.getByText(commonTranslations.NOT_AVAILABLE)).toBeInTheDocument();
	});
});
