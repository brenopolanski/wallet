import React from "react";
import { render, screen } from "utils/testing-library";

import { FormHelperText } from "./FormHelperText";
import { FormFieldProvider } from "./useFormField";

describe("FormHelperText", () => {
	it("should render hint text", () => {
		const hintMessage = "Test Message";
		const errorMessage = "Error Message";
		const { asFragment } = render(
			<FormHelperText errorMessage={errorMessage}>{hintMessage}</FormHelperText>,
		);

		expect(screen.queryByText(hintMessage)).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should not show hint if is invalid", () => {
		const hintMessage = "Test Message";
		render(<FormHelperText isInvalid>{hintMessage}</FormHelperText>);

		expect(screen.queryByText(hintMessage)).toBeNull();
	});

	it("should render error message", () => {
		const hintMessage = "Test Message";
		const errorMessage = "Error Message";
		const { asFragment } = render(
			<FormHelperText errorMessage={errorMessage} isInvalid>
				{hintMessage}
			</FormHelperText>,
		);

		expect(screen.queryByText(errorMessage)).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render if nothing is provided", () => {
		const { container } = render(<FormHelperText />);

		expect(container).toMatchInlineSnapshot(`<div />`);
	});

	it("should read data from context", () => {
		const context = {
			errorMessage: "Error message from context",
			isInvalid: true,
			name: "test",
		};
		const tree = (
			<FormFieldProvider value={context}>
				<FormHelperText />
			</FormFieldProvider>
		);
		render(tree);

		expect(screen.queryByText(context.errorMessage)).toBeInTheDocument();
	});
});
