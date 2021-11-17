import userEvent from "@testing-library/user-event";
import React, { useRef } from "react";
import { render, screen } from "utils/testing-library";

import { TruncateMiddleDynamic } from "./TruncateMiddleDynamic";

describe("TruncateMiddleDynamic", () => {
	it("should render", () => {
		const { asFragment } = render(<TruncateMiddleDynamic value="Lorem ipsum dolor sit amet" />);

		expect(screen.getByText("Lorem ipsum dolor sit amet")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with tooltip in the dark mode", () => {
		const parentElement = document.createElement("div");

		const Component = ({ value }: { value: string }) => {
			const referenceElement = useRef(parentElement);

			return <TruncateMiddleDynamic parentRef={referenceElement} value={value} tooltipDarkTheme />;
		};

		const { rerender } = render(<Component value="Lorem ipsum dolor sit amet" />);

		const parentWidthSpy = jest.spyOn(parentElement, "offsetWidth", "get").mockReturnValueOnce(40);

		const element = document.createElement("span");

		// offsetWidth is read twice for each overflow check
		const elementWidthSpy = jest
			.spyOn(element, "offsetWidth", "get")
			.mockReturnValueOnce(100)
			.mockReturnValueOnce(100)
			.mockReturnValueOnce(50)
			.mockReturnValueOnce(50);

		const createElementSpy = jest.spyOn(document, "createElement").mockReturnValue(element);

		rerender(<Component value="Lorem ipsum dolor sit ame" />);

		userEvent.hover(screen.getByText("Lorem ipsu…or sit ame"));

		expect(screen.getByRole("tooltip")).toHaveAttribute("data-theme", "dark");

		parentWidthSpy.mockRestore();
		elementWidthSpy.mockRestore();
		createElementSpy.mockRestore();
	});
});
