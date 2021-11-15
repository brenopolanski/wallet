import { Contracts } from "@payvo/profiles";
import { translations } from "domains/transaction/i18n";
import React from "react";
import { Route } from "react-router-dom";
import { env, getDefaultProfileId, render } from "utils/testing-library";

import { TransactionRecipients } from "./TransactionRecipients";

let profile: Contracts.IProfile;

describe("TransactionRecipients", () => {
	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
	});

	it("should render a single recipient", () => {
		const address = "test-address";

		const { container } = render(<TransactionRecipients currency="DARK" recipients={[{ address }]} />);

		expect(container).toHaveTextContent(translations.RECIPIENT);
		expect(container).toHaveTextContent(address);

		expect(container).toMatchSnapshot();
	});

	it("should render a single recipient with alias", () => {
		const address = "test-address";
		const alias = "test-alias";

		const { container } = render(<TransactionRecipients currency="DARK" recipients={[{ address, alias }]} />);

		expect(container).toHaveTextContent(translations.RECIPIENT);
		expect(container).toHaveTextContent(address);
		expect(container).toHaveTextContent(alias);

		expect(container).toMatchSnapshot();
	});

	it("should render a recipients array", () => {
		const address = "test-address";

		const { container } = render(
			<Route path="/profiles/:profileId">
				<TransactionRecipients
					currency="DARK"
					recipients={[
						{ address, amount: 1 },
						{ address, amount: 1 },
					]}
				/>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}`],
			},
		);

		expect(container).toHaveTextContent("1 DARK");
		expect(container).toHaveTextContent(address);

		expect(container).toMatchSnapshot();
	});

	it("should render the delegate icon if isDelegate", () => {
		const address = "test-address";

		const { container } = render(
			<TransactionRecipients currency="DARK" recipients={[{ address, isDelegate: true }]} />,
		);

		expect(container).toHaveTextContent(translations.RECIPIENT);
		expect(container).toHaveTextContent(address);

		expect(container).toMatchSnapshot();
	});
});
