import React from "react";
import { render } from "utils/testing-library";

import { Divider } from "./Divider";

describe("Divider", () => {
	const sizes = ["sm", "md", "lg", "default"];

	it("should render", () => {
		const { container, asFragment } = render(<Divider />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render horizontal type", () => {
		const { container } = render(<Divider type="horizontal" />);

		expect(container).toMatchSnapshot();
	});

	it("should render vertical type", () => {
		const { container } = render(<Divider type="vertical" />);

		expect(container).toMatchSnapshot();
	});

	it.each(sizes)("should render vertical with size %s", (size) => {
		const { container } = render(<Divider type="vertical" size={size as any} />);

		expect(container).toMatchSnapshot();
	});

	it.each(sizes)("should render horizontal with size %s", (size) => {
		const { container } = render(<Divider type="horizontal" size={size as any} />);

		expect(container).toMatchSnapshot();
	});

	it("should render a dashed", () => {
		const { container } = render(<Divider dashed />);

		expect(container).toMatchSnapshot();
	});
});
