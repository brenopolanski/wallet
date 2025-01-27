import React from "react";
import { render, screen } from "utils/testing-library";

import { Icon } from "./Icon";

describe("Icon", () => {
	it("should render", () => {
		const { container, asFragment } = render(<Icon name="ARK" />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render fallback", () => {
		const { asFragment } = render(<Icon name="unknown" fallback={<span>Not found</span>} />);

		expect(screen.getByText("Not found")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it.each(["sm", "md", "lg", "xl"])("should render with size '%s'", (size) => {
		const { asFragment } = render(<Icon name="ARK" size={size} />);

		expect(asFragment).toMatchSnapshot();
	});
});
