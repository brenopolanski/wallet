import userEvent from "@testing-library/user-event";
import React from "react";
import { Route } from "react-router-dom";
import { render } from "utils/testing-library";

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
		const { getByText, getByTestId } = render(
			<Route pathname="/">
				<TestComponent />
			</Route>,
		);

		expect(getByTestId("header_test")).toBeInTheDocument();

		userEvent.click(getByTestId("header_test"));

		expect(getByText("useQueryParams Test Component")).toBeInTheDocument();
	});
});
