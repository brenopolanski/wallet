import React from "react";
import { render, screen } from "utils/testing-library";

import { TransactionDetail } from "./TransactionDetail";

describe("TransactionDetail", () => {
	it("should render", () => {
		const { container } = render(<TransactionDetail label="Test">test</TransactionDetail>);

		expect(container).toMatchSnapshot();
	});

	it("should render without border", () => {
		const { container } = render(
			<TransactionDetail label="Test" border={false}>
				test
			</TransactionDetail>,
		);

		expect(container).toMatchSnapshot();
	});

	it.each(["top", "bottom"])("should render with %s border", (position) => {
		const { container } = render(
			<TransactionDetail label="Test" borderPosition={position}>
				test
			</TransactionDetail>,
		);

		expect(container).toMatchSnapshot();
	});

	it("should render without padding", () => {
		const { container } = render(
			<TransactionDetail label="Test" padding={false}>
				test
			</TransactionDetail>,
		);

		expect(container).toMatchSnapshot();
	});

	it("should render with extra children", () => {
		const { container } = render(
			<TransactionDetail label="Test" padding={false} extra={<div data-testid="TEST_CHILD" />}>
				test
			</TransactionDetail>,
		);

		expect(screen.getByTestId("TEST_CHILD")).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});
});
