import { fireEvent } from "@testing-library/react";
import { ipcRenderer } from "electron";
import React from "react";
import { render, screen } from "utils/testing-library";

import { PluginSpecs } from "./PluginSpecs";

describe("PluginSpecs", () => {
	it("should render properly", async () => {
		const ipcRendererMock = jest.spyOn(ipcRenderer, "send").mockImplementation();

		const { asFragment } = render(
			<PluginSpecs
				author="Payvo"
				category="utility"
				url="https://github.com/arkecosystem/explorer"
				version="1.3.8"
				size="4.2 Mb"
			/>,
		);

		fireEvent.click(screen.getByTestId("PluginSpecs__website"));

		expect(ipcRendererMock).toHaveBeenLastCalledWith("open-external", "https://github.com/arkecosystem/explorer");

		await screen.findByText("Payvo");
		await screen.findByText("Utility");
		await screen.findByText("View");
		await screen.findByText("1.3.8");
		await screen.findByText("4.2 Mb");

		expect(asFragment()).toMatchSnapshot();

		ipcRendererMock.mockRestore();
	});

	it("should render without url and size", async () => {
		const { asFragment } = render(
			<PluginSpecs author="Payvo" category="utility" version="1.3.8" />,
		);

		await screen.findByText("Payvo");
		await screen.findByText("Utility");

		await expect(screen.findAllByText("N/A")).resolves.toHaveLength(2);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show loading state for size", () => {
		const { container } = render(<PluginSpecs author="Payvo" category="utility" version="1.3.8" isLoadingSize />);

		expect(screen.getByTestId("PluginSpecs__size-skeleton")).toBeInTheDocument();
		expect(container).toMatchSnapshot();
	});
});
