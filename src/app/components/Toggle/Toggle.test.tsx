import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { Toggle } from "./Toggle";

describe("Toggle", () => {
	it("should render", () => {
		const { container, asFragment } = render(<Toggle />);

		expect(container).toBeInTheDocument();
		expect(screen.getByRole("checkbox")).not.toHaveAttribute("checked", "");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render disabled", () => {
		const { container, asFragment } = render(<Toggle disabled />);

		expect(container).toBeInTheDocument();
		expect(screen.getByRole("checkbox")).toBeDisabled();
		expect(screen.getByRole("checkbox")).not.toHaveAttribute("checked", "");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render small", () => {
		const { container, asFragment } = render(<Toggle small />);

		expect(container).toBeInTheDocument();
		expect(screen.getByRole("checkbox")).not.toHaveAttribute("checked", "");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render always on", () => {
		const { container, asFragment } = render(<Toggle alwaysOn />);

		expect(container).toBeInTheDocument();
		expect(screen.getByRole("checkbox")).not.toHaveAttribute("checked", "");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle checked", () => {
		const { asFragment } = render(<Toggle />);
		const toggle = screen.getByRole("checkbox");

		fireEvent.change(toggle, { target: { checked: true } });

		expect(toggle.checked).toBe(true);
		expect(asFragment()).toMatchSnapshot();
	});
});
