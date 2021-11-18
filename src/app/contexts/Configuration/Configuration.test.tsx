import userEvent from "@testing-library/user-event";
import React from "react";
import { render, waitFor } from "utils/testing-library";

import { ConfigurationProvider, useConfiguration } from "./Configuration";

describe("Configuration Context", () => {
	it("should render the wrapper properly", () => {
		const { container, asFragment, getByTestId } = render(
			<ConfigurationProvider>
				<span data-testid="ConfigurationProvider__content">Configuration Provider content</span>
			</ConfigurationProvider>,
		);

		expect(getByTestId("ConfigurationProvider__content")).toBeInTheDocument();

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should throw without provider", () => {
		jest.spyOn(console, "error").mockImplementation(() => null);
		const Test = () => {
			useConfiguration();
			return <p>Configuration content</p>;
		};

		expect(() => render(<Test />, { withProviders: false })).toThrow(
			"[useConfiguration] Component not wrapped within a Provider",
		);

		console.error.mockRestore();
	});

	it("should render configuration consumer component", () => {
		const Test = () => {
			useConfiguration();
			return <p data-testid="Configuration__consumer">Configuration content</p>;
		};
		const { getByTestId } = render(<Test />);

		expect(getByTestId("Configuration__consumer")).toBeInTheDocument();
	});

	it("should update configuration", async () => {
		const Test = () => {
			const { dashboard, setConfiguration } = useConfiguration();
			return (
				<div
					data-testid="Configuration__consumer"
					onClick={() => setConfiguration({ dashboard: { viewType: "list" } })}
				>
					Configuration content
					{dashboard && dashboard.viewType === "list" && <div data-testid="Configuration__list" />}
				</div>
			);
		};

		const { getByTestId, asFragment, findByTestId } = render(<Test />);

		expect(getByTestId("Configuration__consumer")).toBeInTheDocument();

		await waitFor(() => expect(() => getByTestId("Configuration__list")).toThrow(/Unable to find/));

		userEvent.click(getByTestId("Configuration__consumer"));

		await findByTestId("Configuration__list");

		expect(asFragment()).toMatchSnapshot();
	});
});
