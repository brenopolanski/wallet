import React, { useState } from "react";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { InputCurrency } from "./InputCurrency";

describe("InputCurrency", () => {
	it("should render", () => {
		const { asFragment } = render(<InputCurrency />);

		expect(screen.getByTestId("InputCurrency")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should emit formatted value", () => {
		const onChange = jest.fn();
		render(<InputCurrency onChange={onChange} />);
		const input = screen.getByTestId("InputCurrency");

		fireEvent.input(input, {
			target: {
				value: "123",
			},
		});

		expect(onChange).toHaveBeenCalledWith("123");
	});

	it("should not allow letters", () => {
		const onChange = jest.fn();
		render(<InputCurrency onChange={onChange} />);
		const input = screen.getByTestId("InputCurrency");

		fireEvent.input(input, {
			target: {
				value: "abc123",
			},
		});

		expect(onChange).toHaveBeenCalledWith("123");
	});

	it("should format with a default value", () => {
		render(<InputCurrency value=".01" />);
		const input = screen.getByTestId("InputCurrency");

		expect(input).toHaveValue("0.01");
	});

	it("should fallback on convert value", () => {
		const { rerender } = render(<InputCurrency value=".01" />);
		const input = screen.getByTestId("InputCurrency");

		expect(input).toHaveValue("0.01");

		rerender(<InputCurrency value={undefined} />);

		waitFor(() => expect(input).toHaveValue("0"));
	});

	it("should work with a controlled value", () => {
		const Component = () => {
			const [value, setValue] = useState("0.04");
			return <InputCurrency value={value} onChange={setValue} />;
		};
		render(<Component />);
		const input = screen.getByTestId("InputCurrency");

		expect(input).toHaveValue("0.04");

		fireEvent.input(input, {
			target: {
				value: "1.23",
			},
		});

		waitFor(() => expect(input).toHaveValue("1.23"));
	});
});
