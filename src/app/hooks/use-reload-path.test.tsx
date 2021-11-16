import userEvent from "@testing-library/user-event";
import React from "react";
import { Route } from "react-router-dom";
import { render } from "utils/testing-library";

import { useReloadPath } from "./use-reload-path";

describe("useReloadPath hook", () => {
	const TestComponent: React.FC = () => {
		const reloadPath = useReloadPath();

		const handle = () => {
			reloadPath();
		};
		return (
			<h1 data-testid="header_test" onClick={handle}>
				UseReloadPath Test Component
			</h1>
		);
	};

	it("should render useReloadPath", () => {
		const { getByText, getByTestId } = render(
			<Route pathname="/">
				<TestComponent />
			</Route>,
		);

		expect(getByTestId("header_test")).toBeInTheDocument();

		userEvent.click(getByTestId("header_test"));

		expect(getByText("UseReloadPath Test Component")).toBeInTheDocument();
	});
});
