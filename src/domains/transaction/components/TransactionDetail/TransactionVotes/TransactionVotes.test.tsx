// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/sdk-profiles/distribution/read-only-wallet";
import React from "react";
import { render, screen, waitFor } from "utils/testing-library";

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
		const { container } = render(<TransactionVotes isLoading={true} />);

		expect(screen.getByTestId("TransactionVotes__skeleton")).toBeInTheDocument();

		expect(container).toMatchSnapshot();
	});

	it("should render with votes", async () => {
		const { container } = render(<TransactionVotes votes={votes} />);

		await screen.findByText("Votes (1)");
		await screen.findByText("test-username");

		expect(container).toMatchSnapshot();
	});

	it("should render with unvotes", async () => {
		const { container } = render(<TransactionVotes unvotes={votes} />);

		await screen.findByText("Unvotes (1)");
		await screen.findByText("test-username");

		expect(container).toMatchSnapshot();
	});

	it("should render with votes and unvotes", async () => {
		const { container } = render(<TransactionVotes votes={votes} unvotes={votes} />);

		await screen.findByText("Votes (1)");
		await screen.findByText("Unvotes (1)");
		await waitFor(() => expect(screen.getAllByText("test-username")).toHaveLength(2));

		expect(container).toMatchSnapshot();
	});
});
