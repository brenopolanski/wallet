import { useGraphTooltip, useGraphWidth } from "app/components/Graphs/Graphs.shared";
import React from "react";
import { act, render } from "utils/testing-library";
import { renderHook } from "@testing-library/react-hooks";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Graphs shared hooks", () => {
	describe("useGraphWidth", () => {
		it("should return reference and width of the element where it is applied", async () => {
			const Component = () => {
				const [reference, width] = useGraphWidth<HTMLDivElement>();

				return <div ref={reference}>{width}</div>;
			};

			const { asFragment } = render(<Component />);

			act(() => {
				global.dispatchEvent(new Event("resize"));
			});

			expect(asFragment()).toMatchSnapshot();
		});
	});

	describe.only("useGraphTooltip", () => {
		describe("when used on a line graph", () => {
			it("returns tooltip component and props for a target element to make it show up", async () => {
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

				await waitFor(() => expect(screen.queryByTestId("TooltipContent")).toHaveTextContent("value is: 10"));

				userEvent.unhover(screen.getByTestId("Rect1"));
				userEvent.hover(screen.getByTestId("Rect2"));

				await waitFor(() => expect(screen.queryByTestId("TooltipContent")).toHaveTextContent("value is: 20"));
			});
		});
	});
});
