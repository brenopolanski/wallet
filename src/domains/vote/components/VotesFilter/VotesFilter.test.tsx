import React from "react";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { VotesFilter } from "./VotesFilter";

describe("VotesFilter", () => {
	it("should render", () => {
		const { asFragment } = render(<VotesFilter totalCurrentVotes={1} />);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render default", async () => {
		const { asFragment } = render(<VotesFilter totalCurrentVotes={1} />);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));

		await screen.findByTestId("dropdown__content");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with current option selected", async () => {
		const { asFragment } = render(<VotesFilter totalCurrentVotes={1} selectedOption="current" />);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));

		await screen.findByTestId("dropdown__content");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with disabled current option", async () => {
		const { asFragment } = render(<VotesFilter totalCurrentVotes={0} />);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));

		await screen.findByTestId("dropdown__content");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit onChange", async () => {
		const onChange = jest.fn();
		render(<VotesFilter totalCurrentVotes={2} onChange={onChange} />);

		fireEvent.click(screen.getByTestId("dropdown__toggle"));

		await screen.findByTestId("dropdown__content");

		fireEvent.click(screen.getByTestId("VotesFilter__option--current"));

		await waitFor(() => expect(onChange).toHaveBeenCalledWith("current"));

		fireEvent.click(screen.getByTestId("VotesFilter__option--all"));

		await waitFor(() => expect(onChange).toHaveBeenCalledWith("all"));
	});
});
