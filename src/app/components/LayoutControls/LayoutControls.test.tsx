import React from "react";
import { fireEvent, render } from "utils/testing-library";

import { LayoutControls } from "./LayoutControls";

describe("LayoutControls", () => {
	it("should render", () => {
		const { asFragment, getByTestId } = render(<LayoutControls />);

		expect(getByTestId("LayoutControls__grid")).toBeInTheDocument();
		expect(getByTestId("LayoutControls__list")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it.each([
		["onSelectGridView", "LayoutControls__grid--icon"],
		["onSelectListView", "LayoutControls__list--icon"],
	])("should call %s callback if provided", (callback, element) => {
		const function_ = jest.fn();

		const { getByTestId } = render(<LayoutControls {...{ [callback]: function_ }} />);

		fireEvent.click(getByTestId(element));

		expect(function_).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it.each([
		["onSelectGridView", "LayoutControls__grid--icon"],
		["onSelectListView", "LayoutControls__list--icon"],
	])("should not call %s callback if not provided", (callback, element) => {
		const function_ = jest.fn();

		const { getByTestId } = render(<LayoutControls />);

		fireEvent.click(getByTestId(element));

		expect(function_).not.toHaveBeenCalled();
	});
});
