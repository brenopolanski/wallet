import { Contracts } from "@payvo/sdk-profiles";
import { ReadOnlyWallet } from "@payvo/sdk-profiles/distribution/read-only-wallet";
import React from "react";
import { data } from "tests/fixtures/coins/ark/devnet/delegates.json";
import { render } from "utils/testing-library";

import { VoteList } from "./VoteList";

let votes: Contracts.IReadOnlyWallet[];
let votesWithAmount: Contracts.VoteRegistryItem[];

describe("VoteList", () => {
	beforeAll(() => {
		const delegates = [0, 1, 2].map(
			(index) =>
				new ReadOnlyWallet({
					address: data[index].address,
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: false,
					publicKey: data[index].publicKey,
					username: data[index].username,
				}),
		);

		votes = delegates;

		votesWithAmount = delegates.map((delegate) => ({
			amount: 10,
			wallet: delegate,
		}));
	});

	it("should render", () => {
		const { container, asFragment } = render(<VoteList currency="BTC" votes={votes} />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render vote amount", () => {
		const { container, asFragment } = render(<VoteList currency="BTC" votes={votesWithAmount} />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with empty list", () => {
		const { container, asFragment } = render(<VoteList currency="BTC" votes={[]} />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});
});
