import userEvent from "@testing-library/user-event";
import React from "react";
import { render } from "utils/testing-library";

import { Toggle } from "./Toggle";

describe("Toggle", () => {
	it("should render", () => {
		const { container, asFragment, getByRole } = render(<Toggle />);

		expect(container).toBeInTheDocument();
		expect(getByRole("checkbox")).not.toHaveAttribute("checked", "");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render disabled", () => {
		const { container, asFragment, getByRole } = render(<Toggle disabled />);

		expect(container).toBeInTheDocument();
		expect(getByRole("checkbox")).toBeDisabled();
		expect(getByRole("checkbox")).not.toHaveAttribute("checked", "");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render small", () => {
		const { container, asFragment, getByRole } = render(<Toggle small />);

		expect(container).toBeInTheDocument();
		expect(getByRole("checkbox")).not.toHaveAttribute("checked", "");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render always on", () => {
		const { container, asFragment, getByRole } = render(<Toggle alwaysOn />);

		expect(container).toBeInTheDocument();
		expect(getByRole("checkbox")).not.toHaveAttribute("checked", "");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle checked", () => {
		const { asFragment, getByRole } = render(<Toggle />);
		const toggle = getByRole("checkbox");

		userEvent.click(toggle);

		expect(toggle.checked).toBe(true);
		expect(asFragment()).toMatchSnapshot();
	});
});
