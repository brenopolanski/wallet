import React from "react";
import { fireEvent, render, waitFor } from "utils/testing-library";

import { VotesFilter } from "./VotesFilter";

describe("VotesFilter", () => {
	it("should render", () => {
		const { asFragment } = render(<VotesFilter totalCurrentVotes={1} />);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render default", async () => {
		const { asFragment, getByTestId, findByTestId } = render(<VotesFilter totalCurrentVotes={1} />);

		fireEvent.click(getByTestId("dropdown__toggle"));

		await findByTestId("dropdown__content");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with current option selected", async () => {
		const { asFragment, getByTestId, findByTestId } = render(
			<VotesFilter totalCurrentVotes={1} selectedOption="current" />,
		);

		fireEvent.click(getByTestId("dropdown__toggle"));

		await findByTestId("dropdown__content");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with disabled current option", async () => {
		const { asFragment, getByTestId, findByTestId } = render(<VotesFilter totalCurrentVotes={0} />);

		fireEvent.click(getByTestId("dropdown__toggle"));

		await findByTestId("dropdown__content");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit onChange", async () => {
		const onChange = jest.fn();
		const { getByTestId, findByTestId } = render(<VotesFilter totalCurrentVotes={2} onChange={onChange} />);

		fireEvent.click(getByTestId("dropdown__toggle"));

		await findByTestId("dropdown__content");

		fireEvent.click(getByTestId("VotesFilter__option--current"));

		await waitFor(() => expect(onChange).toHaveBeenCalledWith("current"));

		fireEvent.click(getByTestId("VotesFilter__option--all"));

		await waitFor(() => expect(onChange).toHaveBeenCalledWith("all"));
	});
});
