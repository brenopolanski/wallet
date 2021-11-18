import React from "react";
import { render, screen } from "utils/testing-library";

import { ReviewRating } from "./ReviewRating";

describe("ReviewRating", () => {
	it("should render", () => {
		const { asFragment } = render(<ReviewRating rating={1.5} />);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with total", () => {
		const { asFragment } = render(<ReviewRating rating={1.5} showTotal={true} />);

		expect(screen.getByTestId("ReviewRating")).toHaveTextContent("1.5/5");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render dash if no rating", () => {
		const { asFragment } = render(<ReviewRating rating={0} showTotal={true} />);

		expect(screen.getByTestId("ReviewRating")).toHaveTextContent("-/5");
		expect(asFragment()).toMatchSnapshot();
	});
});
