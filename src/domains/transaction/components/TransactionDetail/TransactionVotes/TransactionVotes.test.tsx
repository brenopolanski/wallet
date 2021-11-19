// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/sdk-profiles/distribution/cjs/read-only-wallet";
import React from "react";
import { render, waitFor } from "utils/testing-library";

import { TransactionVotes } from "./TransactionVotes";

const votes = [
	// @ts-ignore
	new ReadOnlyWallet({
		address: "test-address",
		username: "test-username",
	}),
];

describe("TransactionVotes", () => {
	it("should render loading state", () => {
		const { container, getByTestId } = render(<TransactionVotes isLoading={true} />);

		expect(getByTestId("TransactionVotes__skeleton")).toBeInTheDocument();

		expect(container).toMatchSnapshot();
	});

	it("should render with votes", async () => {
		const { container, findByText } = render(<TransactionVotes votes={votes} />);

		await findByText("Votes (1)");
		await findByText("test-username");

		expect(container).toMatchSnapshot();
	});

	it("should render with unvotes", async () => {
		const { container, findByText } = render(<TransactionVotes unvotes={votes} />);

		await findByText("Unvotes (1)");
		await findByText("test-username");

		expect(container).toMatchSnapshot();
	});

	it("should render with votes and unvotes", async () => {
		const { container, getAllByText, findByText } = render(<TransactionVotes votes={votes} unvotes={votes} />);

		await findByText("Votes (1)");
		await findByText("Unvotes (1)");
		await waitFor(() => expect(getAllByText("test-username")).toHaveLength(2));

		expect(container).toMatchSnapshot();
	});
});
