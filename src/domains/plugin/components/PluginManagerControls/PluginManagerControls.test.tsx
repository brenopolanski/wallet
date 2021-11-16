import userEvent from "@testing-library/user-event";
import React from "react";
import { fireEvent, render } from "utils/testing-library";

import { PluginManagerControls } from "./PluginManagerControls";

describe("PluginManagerControls", () => {
	it("should render", () => {
		const { asFragment, getByTestId } = render(<PluginManagerControls />);

		expect(getByTestId("PluginManagerControls")).toBeInTheDocument();
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

		const { asFragment, getByTestId } = render(<Component />);

		const gridIcon = getByTestId("LayoutControls__grid--icon");
		const listIcon = getByTestId("LayoutControls__list--icon");

		userEvent.click(listIcon);

		expect(getByTestId("viewType")).toHaveTextContent("list");

		userEvent.click(gridIcon);

		expect(getByTestId("viewType")).toHaveTextContent("grid");

		expect(asFragment()).toMatchSnapshot();
	});
});
