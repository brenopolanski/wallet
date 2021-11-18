import React from "react";
import { fireEvent, render, screen, waitFor } from "utils/testing-library";

import { Pagination } from "./Pagination";

const handleSelectPage = jest.fn();

describe("Pagination", () => {
	beforeEach(() => handleSelectPage.mockReset());

	it("should render", () => {
		const { asFragment } = render(<Pagination totalCount={12} onSelectPage={handleSelectPage} />);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render", () => {
		const { asFragment } = render(
			<Pagination totalCount={4} itemsPerPage={4} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		expect(screen.queryByTestId("Pagination")).toBeNull();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle page selection properly", () => {
		const { asFragment } = render(
			<Pagination totalCount={12} itemsPerPage={4} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		fireEvent.click(screen.getByText("2"));

		expect(handleSelectPage).toHaveBeenCalledWith(2);
		expect(asFragment()).toMatchSnapshot();
	});

	it.each([
		["first", 1],
		["second", 2],
		["third", 3],
	])("should not render first button if pagination buttons include 1 (%s page)", (count, currentPage) => {
		const { asFragment } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={currentPage} />,
		);

		expect(screen.queryByTestId("Pagination__first")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render pagination search buttons", () => {
		const { asFragment } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={5} />,
		);

		expect(screen.getAllByTestId("PaginationSearchButton")).toHaveLength(2);

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render previous buttons on first page", () => {
		const { asFragment } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		expect(screen.queryByTestId("Pagination__previous")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should not render next button on last page", () => {
		const { asFragment } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={10} />,
		);

		expect(screen.queryByTestId("Pagination__next")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it.each([
		["last", 10],
		["second-to-last", 9],
		["third-to-last", 8],
	])("should not render first button if pagination buttons include the last page (%s page)", (count, currentPage) => {
		const { asFragment } = render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={currentPage} />,
		);

		expect(screen.queryByTestId("Pagination__last")).not.toBeInTheDocument();

		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle first page click properly", () => {
		const { asFragment } = render(
			<Pagination totalCount={150} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={101} />,
		);

		fireEvent.click(screen.getByTestId("Pagination__first"));

		expect(handleSelectPage).toHaveBeenCalledWith(1);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle previous page click properly", () => {
		const { asFragment } = render(
			<Pagination totalCount={40} itemsPerPage={4} onSelectPage={handleSelectPage} currentPage={9} />,
		);

		fireEvent.click(screen.getByTestId("Pagination__previous"));

		expect(handleSelectPage).toHaveBeenCalledWith(8);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle next page click properly", () => {
		const { asFragment } = render(
			<Pagination totalCount={12} itemsPerPage={4} onSelectPage={handleSelectPage} currentPage={2} />,
		);

		fireEvent.click(screen.getByTestId("Pagination__next"));

		expect(handleSelectPage).toHaveBeenCalledWith(3);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle last page click properly", () => {
		const { asFragment } = render(
			<Pagination totalCount={30} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		fireEvent.click(screen.getByTestId("Pagination__last"));

		expect(handleSelectPage).toHaveBeenCalledWith(30);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle left pagination search icon click properly", () => {
		const { asFragment } = render(
			<Pagination totalCount={30} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={15} />,
		);

		fireEvent.click(screen.getAllByTestId("PaginationSearchButton")[0]);

		expect(screen.getByTestId("PaginationSearch__input")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle right pagination search icon click properly", () => {
		const { asFragment } = render(
			<Pagination totalCount={30} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={15} />,
		);

		fireEvent.click(screen.getAllByTestId("PaginationSearchButton")[1]);

		expect(screen.getByTestId("PaginationSearch__input")).toBeInTheDocument();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should handle page selection from pagination search properly", async () => {
		render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		fireEvent.click(screen.getByTestId("PaginationSearchButton"));

		fireEvent.input(screen.getByTestId("PaginationSearch__input"), {
			target: {
				value: "5",
			},
		});

		await waitFor(() => expect(screen.getByTestId("PaginationSearch__input")).toHaveValue(5));

		fireEvent.click(screen.getByTestId("PaginationSearch__submit"));

		await waitFor(() => expect(handleSelectPage).toHaveBeenCalledWith(5));
	});

	it("should handle close button from pagination search properly", async () => {
		render(
			<Pagination totalCount={10} itemsPerPage={1} onSelectPage={handleSelectPage} currentPage={1} />,
		);

		fireEvent.click(screen.getByTestId("PaginationSearchButton"));

		expect(screen.getByTestId("PaginationSearch__input")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("PaginationSearch__cancel"));
		await waitFor(() => expect(handleSelectPage).not.toHaveBeenCalled());
	});
});
