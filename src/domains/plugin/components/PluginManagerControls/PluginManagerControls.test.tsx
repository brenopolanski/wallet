import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { PluginManagerControls } from "./PluginManagerControls";

describe("PluginManagerControls", () => {
	it("should render", () => {
		const { asFragment } = render(<PluginManagerControls />);

		expect(screen.getByTestId("PluginManagerControls")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should toggle between list and grid", () => {
		const Component = () => {
			const [viewType, setViewType] = React.useState("grid");

			return (
				<div>
					<span data-testid="viewType">{viewType}</span>
					<PluginManagerControls
						selectedViewType={viewType}
						onSelectListView={() => setViewType("list")}
						onSelectGridView={() => setViewType("grid")}
					/>
				</div>
			);
		};

		const { asFragment } = render(<Component />);

		const gridIcon = screen.getByTestId("LayoutControls__grid--icon");
		const listIcon = screen.getByTestId("LayoutControls__list--icon");

		fireEvent.click(listIcon);

		expect(screen.getByTestId("viewType")).toHaveTextContent("list");

		fireEvent.click(gridIcon);

		expect(screen.getByTestId("viewType")).toHaveTextContent("grid");

		expect(asFragment()).toMatchSnapshot();
	});
});
