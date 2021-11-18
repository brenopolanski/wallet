import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render, screen } from "utils/testing-library";

import { FilterTransactions } from "./FilterTransactions";

let profile: Contracts.IProfile;

describe("FilterTransactions", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		await profile.sync();
	});

	it("should render", () => {
		const { container } = render(<FilterTransactions />);

		expect(screen.getByRole("button", { name: /Type/ })).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});

	it("should render with default selected option", () => {
		const { container } = render(
			<FilterTransactions defaultSelected={{ label: "All", value: "all" }} />,
		);

		expect(screen.getByRole("button", { name: /Type/ })).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});

	it("should open dropdown list with all transaction types", async () => {
		const { container } = render(
			<FilterTransactions wallets={profile.wallets().values()} />,
		);

		expect(screen.getByRole("button", { name: /Type/ })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Type/ }));

		await screen.findByTestId("dropdown__option--core-0");

		expect(container).toMatchSnapshot();
	});

	it("should emit onChange", async () => {
		const onSelect = jest.fn();

		render(
			<FilterTransactions wallets={profile.wallets().values()} onSelect={onSelect} />,
		);

		expect(screen.getByRole("button", { name: /Type/ })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Type/ }));

		await screen.findByTestId("dropdown__option--core-0");

		fireEvent.click(screen.getByTestId("dropdown__option--core-0"));

		expect(onSelect).toHaveBeenCalledWith(
			{
				label: expect.any(String),
				value: expect.any(String),
			},
			expect.any(String),
		);
	});
});
