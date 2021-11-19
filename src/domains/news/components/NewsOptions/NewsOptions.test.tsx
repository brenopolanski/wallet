import { AvailableNewsCategories } from "domains/news/news.contracts";
import React from "react";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { NewsOptions } from "./NewsOptions";

const categories: AvailableNewsCategories[] = ["Technical"];
const coins = ["ark"];

describe("NewsOptions", () => {
	it("should render", () => {
		const { container, asFragment } = render(<NewsOptions selectedCategories={categories} selectedCoins={coins} />);

		expect(container).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should select category", () => {
		render(<NewsOptions selectedCategories={categories} selectedCoins={coins} onSubmit={jest.fn()} />);

		fireEvent.click(screen.getByTestId("NewsOptions__category-Technical"));
	});

	it("should select asset", () => {
		render(<NewsOptions selectedCategories={categories} selectedCoins={coins} />);

		const arkOption = screen.getByTestId("NetworkOption__ark.mainnet");
		fireEvent.click(arkOption);
	});

	it("should emit onSubmit with all selected filters", async () => {
		const onSubmit = jest.fn();

		render(<NewsOptions selectedCategories={categories} selectedCoins={coins} onSubmit={onSubmit} />);

		fireEvent.click(screen.getByTestId("NewsOptions__category-Technical"));
		fireEvent.click(screen.getByTestId("NetworkOption__ark.mainnet"));

		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith({
				categories: ["Technical"],
				coins: ["ARK"],
			}),
		);
	});
});
