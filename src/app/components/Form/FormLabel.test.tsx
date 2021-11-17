import "@testing-library/jest-dom/extend-expect";

import userEvent from "@testing-library/user-event";
import React from "react";
import { render } from "utils/testing-library";

import { FormLabel } from "./FormLabel";
import { FormFieldProvider } from "./useFormField";

describe("FormLabel", () => {
	it("should render from children", () => {
		const label = "Test Label";
		const { queryByText } = render(<FormLabel>{label}</FormLabel>);

		expect(queryByText(label)).toBeInTheDocument();
	});

	it("should render from prop", () => {
		const label = "Test Label";
		const { queryByText } = render(<FormLabel label={label} />);

		expect(queryByText(label)).toBeInTheDocument();
	});

	it("should render with name from context", () => {
		const label = "Test Label";
		const context = {
			errorMessage: "Error message from context",
			isInvalid: true,
			name: "test",
		};
		const tree = (
			<FormFieldProvider value={context}>
				<FormLabel label={label} />
			</FormFieldProvider>
		);
		const { queryByTestId, asFragment } = render(tree);

		expect(queryByTestId("FormLabel")).toHaveAttribute("for", context.name);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render & hover if optional", () => {
		const { asFragment, baseElement, getByTestId } = render(<FormLabel label="Test" optional />);

		userEvent.hover(getByTestId("FormLabel__optional"));

		expect(baseElement).toHaveTextContent("This field is optional");
		expect(asFragment()).toMatchSnapshot();
	});
});
