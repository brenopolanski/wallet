import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import { ipcRenderer } from "electron";
import React from "react";
import { render, screen } from "utils/testing-library";

import { PluginSpecs } from "./PluginSpecs";

describe("PluginSpecs", () => {
	it("should render properly", async () => {
		const ipcRendererMock = jest.spyOn(ipcRenderer, "send").mockImplementation();

		const { asFragment, findByText, getByTestId } = render(
			<PluginSpecs
				author="Payvo"
				category="Utility"
				url="https://github.com/arkecosystem/explorer"
				version="1.3.8"
				size="4.2 Mb"
			/>,
		);

		userEvent.click(getByTestId("PluginSpecs__website"));

		expect(ipcRendererMock).toHaveBeenLastCalledWith("open-external", "https://github.com/arkecosystem/explorer");

		await findByText("Payvo");
		await findByText("Utility");
		await findByText("View");
		await findByText("1.3.8");
		await findByText("4.2 Mb");

		expect(asFragment()).toMatchSnapshot();

		ipcRendererMock.mockRestore();
	});

	it("should render without url and size", async () => {
		const { asFragment, findAllByText, findByText } = render(
			<PluginSpecs author="Payvo" category="Utility" version="1.3.8" isOfficial />,
		);

		await findByText("Payvo");
		await findByText("Utility");

		await expect(findAllByText("N/A")).resolves.toHaveLength(2);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show loading state for size", () => {
		const { container } = render(<PluginSpecs author="Payvo" category="Utility" version="1.3.8" isLoadingSize />);

		expect(screen.getByTestId("PluginSpecs__size-skeleton")).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});
});
