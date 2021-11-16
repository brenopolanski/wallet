import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { render } from "utils/testing-library";

import { ButtonGroup, ButtonGroupOption } from "./ButtonGroup";
import { useSelectionState } from "./useSelectionState";

describe("ButtonGroup", () => {
	it("should render", () => {
		const { asFragment } = render(<ButtonGroup />);

		expect(screen.getByTestId("ButtonGroup")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});
});

describe("ButtonGroupOption", () => {
	it("should render", () => {
		const isSelected = jest.fn((value: any) => value === 1);
		const setSelectedValue = jest.fn();

		const { asFragment } = render(
			<>
				<ButtonGroupOption isSelected={isSelected} setSelectedValue={setSelectedValue} value={1}>
					Test 1
				</ButtonGroupOption>
				<ButtonGroupOption isSelected={isSelected} setSelectedValue={setSelectedValue} value={2}>
					Test 2
				</ButtonGroupOption>
			</>,
		);

		const buttons = screen.getAllByTestId("ButtonGroupOption");

		expect(buttons[0]).toHaveAttribute("aria-checked", "true");
		expect(buttons[1]).toHaveAttribute("aria-checked", "false");

		userEvent.click(buttons[0]);

		expect(setSelectedValue).toHaveBeenCalledWith(1);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with modern variant", () => {
		const Component = () => {
			const state = useSelectionState(undefined);

			return (
				<ButtonGroupOption {...state} value="test" variant="modern" tooltipContent="tooltip">
					Test
				</ButtonGroupOption>
			);
		};

		const { asFragment } = render(<Component />);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should work with useSelectionState", () => {
		const Component = () => {
			const state = useSelectionState(undefined);

			return (
				<>
					<span data-testid="selectedValue">{state.selectedValue}</span>
					<ButtonGroupOption {...state} value={1}>
						Test 1
					</ButtonGroupOption>
					<ButtonGroupOption {...state} value={2}>
						Test 2
					</ButtonGroupOption>
				</>
			);
		};

		render(<Component />);

		const buttons = screen.getAllByTestId("ButtonGroupOption");

		expect(buttons[0]).toHaveAttribute("aria-checked", "false");
		expect(buttons[1]).toHaveAttribute("aria-checked", "false");

		userEvent.click(buttons[0]);

		expect(screen.getByTestId("selectedValue")).toHaveTextContent("1");
	});
});
