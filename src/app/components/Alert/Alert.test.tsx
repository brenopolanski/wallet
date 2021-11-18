import React from "react";
import { render, screen } from "utils/testing-library";

import { Alert, AlertVariant } from "./Alert";

describe("Alert", () => {
	it("should render", () => {
		const { container, asFragment } = render(<Alert />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it.each(["info", "success", "warning", "danger", "hint"])("should render as %s alert", (variant) => {
		const { container, asFragment } = render(<Alert variant={variant as AlertVariant} />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with title", () => {
		render(<Alert title="Hello!" />);

		expect(screen.getByTestId("Alert__title")).toHaveTextContent("Hello!");
	});

	it("should render with children", () => {
		render(<Alert title="Hello!">I am a children</Alert>);

		expect(screen.getByTestId("Alert__title")).toHaveTextContent("Hello!");
		expect(screen.getByText("I am a children")).toBeInTheDocument();
	});
});
