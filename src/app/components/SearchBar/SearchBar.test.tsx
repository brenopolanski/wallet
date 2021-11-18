/* eslint-disable @typescript-eslint/require-await */
import { waitFor } from "@testing-library/react";
import { translations } from "app/i18n/common/i18n";
import React from "react";
import { fireEvent, render, screen } from "utils/testing-library";

import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
	it("should render", () => {
		const { asFragment } = render(<SearchBar />);

		expect(screen.getByTestId("SearchBar")).toHaveTextContent(translations.SEARCH_BAR.FIND_IT);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with children", () => {
		render(<SearchBar>I am a children</SearchBar>);

		expect(screen.getByText("I am a children")).toBeInTheDocument();
	});

	it("should call onSearch callback on button click", async () => {
		const onSearch = jest.fn();

		render(<SearchBar onSearch={onSearch} />);

		fireEvent.change(screen.getByTestId("Input"), {
			target: {
				value: "test query",
			},
		});

		fireEvent.click(screen.getByTestId("SearchBar__button"));

		await waitFor(() => expect(onSearch).toHaveBeenCalledWith("test query"));
	});
});
