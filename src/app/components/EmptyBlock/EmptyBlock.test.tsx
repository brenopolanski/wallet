import React from "react";
import { render } from "utils/testing-library";

import { EmptyBlock } from "./EmptyBlock";

describe("EmptyBlock", () => {
	it("should render", () => {
		const { asFragment, container } = render(<EmptyBlock />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with children", () => {
		const { getByText } = render(<EmptyBlock>I am a children</EmptyBlock>);

		expect(getByText("I am a children")).toBeInTheDocument();
	});

	it("should render with size", () => {
		const { container } = render(<EmptyBlock size="sm">I am a children</EmptyBlock>);

		expect(container).toMatchSnapshot();
	});
});
