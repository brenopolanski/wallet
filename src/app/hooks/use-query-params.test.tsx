import { fireEvent } from "@testing-library/react";
import React from "react";
import { Route } from "react-router-dom";
import { render, screen } from "utils/testing-library";

import { useQueryParams as useQueryParameters } from "./use-query-params";

describe("useQueryParams hook", () => {
	const TestComponent: React.FC = () => {
		const reloadPath = useQueryParameters();

		const handle = () => {
			reloadPath.get("");
		};
		return (
			<h1 data-testid="header_test" onClick={handle}>
				useQueryParams Test Component
			</h1>
		);
	};

	it("should render useQueryParams", () => {
		render(
			<Route pathname="/">
				<TestComponent />
			</Route>,
		);

		expect(screen.getByTestId("header_test")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("header_test"));

		expect(screen.getByText("useQueryParams Test Component")).toBeInTheDocument();
	});
});
