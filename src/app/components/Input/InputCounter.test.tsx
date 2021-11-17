import userEvent from "@testing-library/user-event";
import { FormFieldProvider } from "app/components/Form/useFormField";
import React from "react";
import { render } from "utils/testing-library";

import { InputCounter } from "./InputCounter";

describe("InputCounter", () => {
	it("should render", () => {
		const { getByTestId, asFragment } = render(<InputCounter maxLength={10} maxLengthLabel="10" />);

		expect(getByTestId("InputCounter__counter")).toHaveTextContent("0/10");
		expect(getByTestId("InputCounter__input")).toHaveAttribute("maxLength", "10");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with default value", () => {
		const { getByTestId } = render(<InputCounter maxLength={10} maxLengthLabel="10" defaultValue="Hello" />);

		expect(getByTestId("InputCounter__counter")).toHaveTextContent("5/10");
	});

	it("should update the length when changing the value", () => {
		const { getByTestId } = render(<InputCounter maxLength={10} maxLengthLabel="10" />);

		userEvent.type(getByTestId("InputCounter__input"), "Test");

		expect(getByTestId("InputCounter__counter")).toHaveTextContent("4/10");
	});

	it("should render with invalid state", () => {
		const { container } = render(
			<FormFieldProvider value={{ isInvalid: true, name: "vendorField" }}>
				<InputCounter maxLength={10} maxLengthLabel="10" />
			</FormFieldProvider>,
		);

		expect(container).toMatchSnapshot();
	});
});
