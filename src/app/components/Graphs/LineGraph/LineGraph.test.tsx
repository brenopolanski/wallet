import userEvent from "@testing-library/user-event";
import * as sharedGraphUtils from "app/components/Graphs/Graphs.shared";
import React from "react";
import { render, screen, waitFor } from "utils/testing-library";

import { LineGraph } from "./LineGraph";
import { LineGraphDataPoint } from "./LineGraph.contracts";

describe("LineGraph", () => {
	let data: LineGraphDataPoint[];
	let useWidthMock: jest.SpyInstance;

	beforeAll(() => {
		data = [
			{ color: "success-600", data: { label: "item 1" }, value: 50 },
			{ color: "warning-600", data: { label: "item 2" }, value: 30 },
			{ color: "info-600", data: { label: "item 3" }, value: 20 },
		];

		// Mock graph width to 100.
		useWidthMock = jest.spyOn(sharedGraphUtils, "useGraphWidth").mockReturnValue([undefined as never, 100]);
	});

	afterAll(() => {
		useWidthMock.mockRestore();
	});

	it("should render", () => {
		const { asFragment } = render(<LineGraph data={data} />);

		expect(screen.getByTestId("LineGraph__svg")).toBeInTheDocument();
		expect(screen.getAllByTestId("LineGraph__item")).toHaveLength(3);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render as empty", () => {
		const { asFragment } = render(<LineGraph data={data} renderAsEmpty />);

		expect(screen.getByTestId("LineGraph__svg")).toBeInTheDocument();
		expect(screen.queryByTestId("LineGraph__item")).not.toBeInTheDocument();
		expect(screen.getByTestId("LineGraph__empty")).toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render tooltip on hover", async () => {
		const { asFragment } = render(
			<LineGraph
				data={data}
				renderTooltip={(dataPoint) => (
					<div data-testid="TooltipContent">
						{dataPoint.data.label} value: {dataPoint.value}
					</div>
				)}
			/>,
		);

		expect(screen.getByTestId("LineGraph__svg")).toBeInTheDocument();
		expect(screen.getAllByTestId("LineGraph__item")).toHaveLength(3);

		expect(screen.queryByTestId("TooltipContent")).not.toBeInTheDocument();

		userEvent.hover(screen.getAllByTestId("LineGraph__item")[0]);

		expect(screen.getByTestId("TooltipContent")).toBeInTheDocument();
		expect(screen.getByTestId("TooltipContent")).toHaveTextContent("item 1 value: 50");

		userEvent.unhover(screen.getAllByTestId("LineGraph__item")[0]);
		userEvent.hover(screen.getAllByTestId("LineGraph__item")[1]);

		expect(screen.getByTestId("TooltipContent")).toHaveTextContent("item 2 value: 30");

		userEvent.unhover(screen.getAllByTestId("LineGraph__item")[1]);

		await waitFor(() => expect(screen.getByTestId("TooltipContent").parentElement).toHaveClass("hidden"));

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render legend", () => {
		const { asFragment } = render(
			<LineGraph
				data={data}
				renderLegend={(dataPoints) => (
					<ul>
						{dataPoints.map((dataPoint, index) => (
							<li key={index}>
								{dataPoint.data.label} value: {dataPoint.value}
							</li>
						))}
					</ul>
				)}
			/>,
		);

		expect(screen.getByTestId("LineGraph__svg")).toBeInTheDocument();
		expect(screen.getAllByTestId("LineGraph__item")).toHaveLength(3);

		expect(screen.getByTestId("LineGraph__legend")).toBeInTheDocument();
		expect(screen.getAllByRole("listitem")).toHaveLength(3);
		expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("item 1 value: 50");

		expect(asFragment()).toMatchSnapshot();
	});
});
