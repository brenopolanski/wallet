import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { TableRemoveButton } from "./TableRemoveButton";

describe("TableRemoveButton", () => {
	it("should render", () => {
		const { container } = render(<TableRemoveButton onClick={jest.fn()} />);

		expect(screen.getByTestId("TableRemoveButton")).toHaveTextContent("trash.svg");

		expect(container).toMatchSnapshot();
	});

	it("should render compact", () => {
		const { container } = render(<TableRemoveButton onClick={jest.fn()} isCompact />);

		expect(screen.getByTestId("TableRemoveButton")).toHaveTextContent("trash.svg");

		expect(container).toMatchSnapshot();
	});

	it("should execute onClick callback", () => {
		const onClick = jest.fn();

		render(<TableRemoveButton onClick={onClick} />);

		fireEvent.click(screen.getByTestId("TableRemoveButton"));

		expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});
});
