import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render } from "utils/testing-library";

import { FilterTransactions } from ".";

let profile: Contracts.IProfile;

describe("FilterTransactions", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		await profile.sync();
	});

	it("should render", () => {
		const { container, getByRole } = render(<FilterTransactions />);

		expect(getByRole("button", { name: /Type/ })).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});

	it("should render with default selected option", () => {
		const { container, getByRole } = render(
			<FilterTransactions defaultSelected={{ label: "All", value: "all" }} />,
		);

		expect(getByRole("button", { name: /Type/ })).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});

	it("should open dropdown list with all transaction types", async () => {
		const { container, getByRole, findByTestId } = render(
			<FilterTransactions wallets={profile.wallets().values()} />,
		);

		expect(getByRole("button", { name: /Type/ })).toBeInTheDocument();

		fireEvent.click(getByRole("button", { name: /Type/ }));

		await findByTestId("dropdown__option--core-0");

		expect(container).toMatchSnapshot();
	});

	it("should emit onChange", async () => {
		const onSelect = jest.fn();

		const { getByRole, getByTestId, findByTestId } = render(
			<FilterTransactions wallets={profile.wallets().values()} onSelect={onSelect} />,
		);

		expect(getByRole("button", { name: /Type/ })).toBeInTheDocument();

		fireEvent.click(getByRole("button", { name: /Type/ }));

		await findByTestId("dropdown__option--core-0");

		fireEvent.click(getByTestId("dropdown__option--core-0"));

		expect(onSelect).toHaveBeenCalledWith(
			{
				label: expect.any(String),
				value: expect.any(String),
			},
			expect.any(String),
		);
	});
});
