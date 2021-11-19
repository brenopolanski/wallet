import { screen, waitFor } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import React from "react";
import { act, render } from "utils/testing-library";

import { useGraphTooltip, useGraphWidth } from "./Graphs.shared";

describe("Graphs shared hooks", () => {
	describe("useGraphWidth", () => {
		it("should return reference and width of the svg element where it is applied", () => {
			const Component = () => {
				const [reference, width] = useGraphWidth();

				return (
					<svg ref={reference}>
						<text>{width}</text>
					</svg>
				);
			};

			const { asFragment } = render(<Component />);

			act(() => {
				global.dispatchEvent(new Event("resize"));
			});

			expect(asFragment()).toMatchSnapshot();
		});

		it("should have 0 as default width when reference is not applied on any element", () => {
			const { result } = renderHook(() => useGraphWidth());

			const [, width] = result.current;

			expect(width).toBe(0);
		});
	});

	describe("useGraphTooltip", () => {
		it("returns empty component and props when the render function is not specified", () => {
			const { result } = renderHook(() => useGraphTooltip(undefined, "line"));

			const { Tooltip, getMouseEventProperties } = result.current;

			expect(Object.keys(getMouseEventProperties(1))).toHaveLength(0);

			const { asFragment } = render(<Tooltip />);

			expect(asFragment()).toMatchInlineSnapshot(`<DocumentFragment />`);
		});

		it("returns tooltip component and props for the target element when type is line", async () => {
			const renderTooltip = (dataPoint: number) => <p data-testid="TooltipContent">value is: {dataPoint}</p>;

			const Component = () => {
				const { Tooltip, getMouseEventProperties } = useGraphTooltip<number>(renderTooltip, "line");

				const rectProperties: React.SVGProps<SVGRectElement> = { height: 4, width: 4, y: 0 };

				return (
					<div>
						<Tooltip />

						<svg width={8} height={4}>
							<rect data-testid="Rect1" x={0} {...rectProperties} {...getMouseEventProperties(10)} />
							<rect data-testid="Rect2" x={4} {...rectProperties} {...getMouseEventProperties(20)} />
						</svg>
					</div>
				);
			};

			render(<Component />);

			expect(screen.queryByTestId("TooltipContent")).not.toBeInTheDocument();

			expect(screen.getByTestId("Rect1")).toBeInTheDocument();
			expect(screen.getByTestId("Rect2")).toBeInTheDocument();

			userEvent.hover(screen.getByTestId("Rect1"));

			await waitFor(() => expect(screen.getByTestId("TooltipContent")).toHaveTextContent("value is: 10"));

			userEvent.unhover(screen.getByTestId("Rect1"));
			userEvent.hover(screen.getByTestId("Rect2"));

			await waitFor(() => expect(screen.getByTestId("TooltipContent")).toHaveTextContent("value is: 20"));

			expect(screen.getByTestId("TooltipContent").parentElement).not.toHaveClass("hidden");

			userEvent.unhover(screen.getByTestId("Rect2"));

			// Wait for the tooltip to fade out completely.
			await waitFor(() => expect(screen.getByTestId("TooltipContent").parentElement).toHaveClass("hidden"));
		});

		it("returns tooltip component and props for the target element when type is donut", async () => {
			const renderTooltip = (dataPoint: number) => <p data-testid="TooltipContent">value is: {dataPoint}</p>;

			const Component = () => {
				const { Tooltip, getMouseEventProperties } = useGraphTooltip<number>(renderTooltip, "donut");

				const circleProperties: React.SVGProps<SVGCircleElement> = {
					cx: 21,
					cy: 21,
					fill: "transparent",
					r: 100 / (2 * Math.PI),
				};

				return (
					<div>
						<Tooltip />

						<svg viewBox="0 0 42 42">
							<circle
								data-testid="Circle1"
								{...circleProperties}
								{...getMouseEventProperties(85)}
								strokeDasharray="85 15"
								strokeDashoffset="25"
							/>
							<circle
								data-testid="Circle2"
								{...circleProperties}
								{...getMouseEventProperties(15)}
								strokeDasharray="15 85"
								strokeDashoffset="40"
							/>
						</svg>
					</div>
				);
			};

			render(<Component />);

			expect(screen.queryByTestId("TooltipContent")).not.toBeInTheDocument();

			expect(screen.getByTestId("Circle1")).toBeInTheDocument();
			expect(screen.getByTestId("Circle2")).toBeInTheDocument();

			userEvent.hover(screen.getByTestId("Circle1"));

			await waitFor(() => expect(screen.getByTestId("TooltipContent")).toHaveTextContent("value is: 85"));

			userEvent.unhover(screen.getByTestId("Circle1"));
			userEvent.hover(screen.getByTestId("Circle2"));

			await waitFor(() => expect(screen.getByTestId("TooltipContent")).toHaveTextContent("value is: 15"));

			expect(screen.getByTestId("TooltipContent").parentElement).not.toHaveClass("hidden");

			userEvent.unhover(screen.getByTestId("Circle2"));

			// Wait for the tooltip to fade out completely.
			await waitFor(() => expect(screen.getByTestId("TooltipContent").parentElement).toHaveClass("hidden"));
		});
	});
});