import userEvent from "@testing-library/user-event";
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "utils/testing-library";

import { HeaderSearchBar } from "./HeaderSearchBar";

describe("HeaderSearchBar", () => {
	it("should render", () => {
		const { asFragment } = render(<HeaderSearchBar />);

		expect(screen.getByRole("button")).toHaveTextContent("Search");
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show the searchbar", () => {
		render(<HeaderSearchBar />);

		userEvent.click(screen.getByRole("button"));

		expect(screen.getByTestId("HeaderSearchBar__input")).toBeInTheDocument();
	});

	it("should limit search letters", () => {
		render(<HeaderSearchBar maxLength={32} />);

		userEvent.click(screen.getByRole("button"));

		const input = screen.getByTestId("Input");

		expect(input.maxLength).toBe(32);

		const text = "loong text";
		const longText = text.repeat(100);

		fireEvent.change(input, { target: { value: longText } });
		fireEvent.change(input, text + "!");

		expect(input.value).toBe(text.repeat(100));
		expect(input.value).toHaveLength(1000);
	});

	it("should reset fields by prop", async () => {
		const onReset = jest.fn();
		const { rerender } = render(<HeaderSearchBar onReset={onReset} />);

		userEvent.click(screen.getByRole("button"));

		const input = screen.getByTestId("Input");

		fireEvent.change(input, {
			target: {
				value: "test",
			},
		});

		expect(input.value).toBe("test");

		rerender(<HeaderSearchBar onReset={onReset} resetFields={true} />);

		await waitFor(() => expect(input.value).not.toBe("test"));

		expect(onReset).toHaveBeenCalledWith();
	});

	it("should show extra slot", () => {
		render(<HeaderSearchBar extra={<div data-testid="extra-slot" />} />);

		userEvent.click(screen.getByRole("button"));

		expect(screen.getByTestId("extra-slot")).toBeInTheDocument();
	});

	it("should hide the searchbar when clicked outside", () => {
		const onSearch = jest.fn();

		render(
			<div>
				<div data-testid="header-search-bar__outside" className="mt-16">
					outside elememt to be clicked
				</div>

				<HeaderSearchBar onSearch={onSearch} />
			</div>,
		);

		userEvent.click(screen.getByRole("button"));

		const outsideElement = screen.getByTestId("header-search-bar__outside");

		expect(outsideElement).toBeInTheDocument();

		expect(screen.getByTestId("Input")).toBeInTheDocument();

		fireEvent.mouseDown(outsideElement);

		expect(() => screen.getByTestId("Input")).toThrow(/Unable to find an element by/);
	});

	it("should reset the query", () => {
		const onReset = jest.fn();
		render(<HeaderSearchBar onReset={onReset} />);

		userEvent.click(screen.getByRole("button"));

		const input = screen.getByTestId("Input");

		fireEvent.change(input, {
			target: {
				value: "test",
			},
		});

		expect(input.value).toBe("test");

		userEvent.click(screen.getByTestId("header-search-bar__reset"));

		expect(input.value).not.toBe("test");
		expect(onReset).toHaveBeenCalledWith();
	});

	it("should call onSearch", () => {
		jest.useFakeTimers();

		const onSearch = jest.fn();

		render(<HeaderSearchBar onSearch={onSearch} />);

		userEvent.click(screen.getByRole("button"));

		fireEvent.change(screen.getByTestId("Input"), {
			target: {
				value: "test",
			},
		});

		act(() => {
			jest.runAllTimers();
		});

		expect(onSearch).toHaveBeenCalledWith("test");
	});

	it("should set custom debounce timeout form props", () => {
		jest.useFakeTimers();

		const onSearch = jest.fn();

		render(<HeaderSearchBar onSearch={onSearch} debounceTimeout={100} />);

		userEvent.click(screen.getByRole("button"));

		fireEvent.change(screen.getByTestId("Input"), {
			target: {
				value: "test",
			},
		});

		act(() => {
			jest.runAllTimers();
		});

		expect(onSearch).toHaveBeenCalledWith("test");
	});
});
