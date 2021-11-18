import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { LayoutControls } from "./LayoutControls";

describe("LayoutControls", () => {
	it("should render", () => {
		const { asFragment } = render(<LayoutControls />);

		expect(screen.getByTestId("LayoutControls__grid")).toBeInTheDocument();
		expect(screen.getByTestId("LayoutControls__list")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it.each([
		["onSelectGridView", "LayoutControls__grid--icon"],
		["onSelectListView", "LayoutControls__list--icon"],
	])("should call %s callback if provided", (callback, element) => {
		const function_ = jest.fn();

		render(<LayoutControls {...{ [callback]: function_ }} />);

		fireEvent.click(screen.getByTestId(element));

		expect(function_).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it.each([
		["onSelectGridView", "LayoutControls__grid--icon"],
		["onSelectListView", "LayoutControls__list--icon"],
	])("should not call %s callback if not provided", (callback, element) => {
		const function_ = jest.fn();

		render(<LayoutControls />);

		fireEvent.click(screen.getByTestId(element));

		expect(function_).not.toHaveBeenCalled();
	});
});
