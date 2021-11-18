import React from "react";
import { render, screen } from "utils/testing-library";

import { DeleteResource } from "./DeleteResource";

const onDelete = jest.fn();

describe("DeleteResource", () => {
	it("should not render if not open", () => {
		const { asFragment } = render(<DeleteResource title="Title" isOpen={false} onDelete={onDelete} />);

		expect(() => screen.getByTestId("modal__inner")).toThrow(/Unable to find an element by/);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with children", () => {
		const { asFragment } = render(
			<DeleteResource title="Title" isOpen={true} onDelete={onDelete}>
				<span>Hello!</span>
			</DeleteResource>,
		);

		expect(screen.getByTestId("modal__inner")).toHaveTextContent("Hello!");
		expect(asFragment()).toMatchSnapshot();
	});
});
