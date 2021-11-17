import userEvent from "@testing-library/user-event";
import React from "react";
import { render } from "utils/testing-library";

import { Select } from "./Select";

describe("Select", () => {
	it("should render a select input with placeholder", () => {
		const placeholder = "Select option";
		const { asFragment, getByText } = render(<Select placeholder="Select option" />);

		expect(getByText(placeholder)).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render a select input with options", () => {
		const { getByTestId, getAllByTestId, asFragment } = render(
			<Select defaultValue={1}>
				<option data-testid="select-option" value={1}>
					Option 1
				</option>
				<option data-testid="select-option" value={2}>
					Option 2
				</option>
			</Select>,
		);

		userEvent.selectOptions(getByTestId("Select"), ["2"]);
		const options = getAllByTestId("select-option");

		expect((options[0] as HTMLOptionElement).selected).toBeFalsy();
		expect((options[1] as HTMLOptionElement).selected).toBeTruthy();

		expect(asFragment()).toMatchSnapshot();
	});
});
