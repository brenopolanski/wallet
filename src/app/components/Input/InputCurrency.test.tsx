import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { render, waitFor } from "utils/testing-library";

import { InputCurrency } from "./InputCurrency";

describe("InputCurrency", () => {
	it("should render", () => {
		const { getByTestId, asFragment } = render(<InputCurrency />);

		expect(getByTestId("InputCurrency")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit formatted value", () => {
		const onChange = jest.fn();
		const { getByTestId } = render(<InputCurrency onChange={onChange} />);
		const input = getByTestId("InputCurrency");

		userEvent.paste(input, "123");

		expect(onChange).toHaveBeenCalledWith("123");
	});

	it("should not allow letters", () => {
		const onChange = jest.fn();
		const { getByTestId } = render(<InputCurrency onChange={onChange} />);
		const input = getByTestId("InputCurrency");

		userEvent.paste(input, "abc123");

		expect(onChange).toHaveBeenCalledWith("123");
	});

	it("should format with a default value", () => {
		const { getByTestId } = render(<InputCurrency value=".01" />);
		const input = getByTestId("InputCurrency");

		expect(input).toHaveValue("0.01");
	});

	it("should fallback on convert value", () => {
		const { getByTestId, rerender } = render(<InputCurrency value=".01" />);
		const input = getByTestId("InputCurrency");

		expect(input).toHaveValue("0.01");

		rerender(<InputCurrency value={undefined} />);

		waitFor(() => expect(input).toHaveValue("0"));
	});

	it("should work with a controlled value", () => {
		const Component = () => {
			const [value, setValue] = useState("0.04");
			return <InputCurrency value={value} onChange={setValue} />;
		};
		const { getByTestId } = render(<Component />);
		const input = getByTestId("InputCurrency");

		expect(input).toHaveValue("0.04");

		userEvent.paste(input, "1.23");

		waitFor(() => expect(input).toHaveValue("1.23"));
	});
});
