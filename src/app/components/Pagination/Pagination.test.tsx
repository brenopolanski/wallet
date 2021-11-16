import userEvent from "@testing-library/user-event";
import React from "react";
import { fireEvent, render, waitFor } from "utils/testing-library";

import { Pagination } from "./Pagination";

const handleSelectPage = jest.fn();

describe("Pagination", () => {
	beforeEach(() => handleSelectPage.mockReset());

	it("should render", () => {
		const { asFragment } = render(<Pagination totalCount={12} onSelectPage={handleSelectPage} />);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render", () => {
		const { asFragment, queryByTestId } = render(
			<Pagination totalCount={4} itemsPerPage={4} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		expect(queryByTestId("Pagination")).toBeNull();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle page selection properly", () => {
		const { asFragment, getByText } = render(
			<Pagination totalCount={12} itemsPerPage={4} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		userEvent.click(getByText("2"));

		expect(handleSelectPage).toHaveBeenCalledWith(2);
		expect(asFragment()).toMatchSnapshot();
	});

	it.each([
		["first", 1],
		["second", 2],
		["third", 3],
	])("should not render first button if pagination buttons include 1 (%s page)", (count, currentPage) => {
		const { asFragment, queryByTestId } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={currentPage} />,
		);

		expect(queryByTestId("Pagination__first")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render pagination search buttons", () => {
		const { asFragment, getAllByTestId } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={5} />,
		);

		expect(getAllByTestId("PaginationSearchButton")).toHaveLength(2);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render previous buttons on first page", () => {
		const { asFragment, queryByTestId } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		expect(queryByTestId("Pagination__previous")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render next button on last page", () => {
		const { asFragment, queryByTestId } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={10} />,
		);

		expect(queryByTestId("Pagination__next")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it.each([
		["last", 10],
		["second-to-last", 9],
		["third-to-last", 8],
	])("should not render first button if pagination buttons include the last page (%s page)", (count, currentPage) => {
		const { asFragment, queryByTestId } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={currentPage} />,
		);

		expect(queryByTestId("Pagination__last")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle first page click properly", () => {
		const { asFragment, getByTestId } = render(
			<Pagination totalCount={150} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={101} />,
		);

		userEvent.click(getByTestId("Pagination__first"));

		expect(handleSelectPage).toHaveBeenCalledWith(1);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle previous page click properly", () => {
		const { asFragment, getByTestId } = render(
			<Pagination totalCount={40} itemsPerPage={4} onSelectPage={handleSelectPage} currentPage={9} />,
		);

		userEvent.click(getByTestId("Pagination__previous"));

		expect(handleSelectPage).toHaveBeenCalledWith(8);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle next page click properly", () => {
		const { asFragment, getByTestId } = render(
			<Pagination totalCount={12} itemsPerPage={4} onSelectPage={handleSelectPage} currentPage={2} />,
		);

		userEvent.click(getByTestId("Pagination__next"));

		expect(handleSelectPage).toHaveBeenCalledWith(3);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle last page click properly", () => {
		const { asFragment, getByTestId } = render(
			<Pagination totalCount={30} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		userEvent.click(getByTestId("Pagination__last"));

		expect(handleSelectPage).toHaveBeenCalledWith(30);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle left pagination search icon click properly", () => {
		const { asFragment, getAllByTestId, getByTestId } = render(
			<Pagination totalCount={30} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={15} />,
		);

		userEvent.click(getAllByTestId("PaginationSearchButton")[0]);

		expect(getByTestId("PaginationSearch__input")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle right pagination search icon click properly", () => {
		const { asFragment, getAllByTestId, getByTestId } = render(
			<Pagination totalCount={30} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={15} />,
		);

		userEvent.click(getAllByTestId("PaginationSearchButton")[1]);

		expect(getByTestId("PaginationSearch__input")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle page selection from pagination search properly", async () => {
		const { getByTestId } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		userEvent.click(getByTestId("PaginationSearchButton"));

		fireEvent.input(getByTestId("PaginationSearch__input"), {
			target: {
				value: "5",
			},
		});

		await waitFor(() => expect(getByTestId("PaginationSearch__input")).toHaveValue(5));

		userEvent.click(getByTestId("PaginationSearch__submit"));

		await waitFor(() => expect(handleSelectPage).toHaveBeenCalledWith(5));
	});

	it("should handle close button from pagination search properly", async () => {
		const { getByTestId } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		userEvent.click(getByTestId("PaginationSearchButton"));

		expect(getByTestId("PaginationSearch__input")).toBeInTheDocument();

		userEvent.click(getByTestId("PaginationSearch__cancel"));
		await waitFor(() => expect(handleSelectPage).not.toHaveBeenCalled());
	});
});
