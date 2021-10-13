/* eslint-disable @typescript-eslint/require-await */
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

		fireEvent.click(screen.getByRole("button"));

		expect(screen.getByTestId("HeaderSearchBar__input")).toBeTruthy();
	});

	it("should limit search letters", () => {
		render(<HeaderSearchBar maxLength={32} />);

		fireEvent.click(screen.getByRole("button"));

		const input = screen.getByTestId("Input") as HTMLInputElement;

		expect(input.maxLength).toBe(32);

		const text = "loong text";
		const longText = text.repeat(100);

		fireEvent.change(input, { target: { value: longText } });
		userEvent.type(input, text + "!");

		expect(input.value).toBe(text.repeat(100));
		expect(input.value.length).toBe(1000);
	});

	it("should reset fields by prop", async () => {
		const onReset = jest.fn();
		const { rerender } = render(<HeaderSearchBar onReset={onReset} />);

		fireEvent.click(screen.getByRole("button"));

		const input = screen.getByTestId("Input") as HTMLInputElement;

		act(() => {
			fireEvent.change(input, {
				target: {
					value: "test",
				},
			});
		});

		expect(input.value).toBe("test");

		rerender(<HeaderSearchBar onReset={onReset} resetFields={true} />);

		await waitFor(() => expect(input.value).not.toBe("test"));

		expect(onReset).toHaveBeenCalled();
	});

	it("should show extra slot", () => {
		render(<HeaderSearchBar extra={<div data-testid="extra-slot" />} />);

		fireEvent.click(screen.getByRole("button"));

		expect(screen.getByTestId("extra-slot")).toBeTruthy();
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

		fireEvent.click(screen.getByRole("button"));

		const outsideElement = screen.getByTestId("header-search-bar__outside");

		expect(outsideElement).toBeTruthy();

		expect(() => screen.getByTestId("Input")).toBeTruthy();

		act(() => {
			fireEvent.mouseDown(outsideElement);
		});

		expect(() => screen.getByTestId("Input")).toThrow(/Unable to find an element by/);
	});

	it("should reset the query", () => {
		const onReset = jest.fn();
		render(<HeaderSearchBar onReset={onReset} />);

		fireEvent.click(screen.getByRole("button"));

		const input = screen.getByTestId("Input") as HTMLInputElement;

		act(() => {
			fireEvent.change(input, {
				target: {
					value: "test",
				},
			});
		});

		expect(input.value).toBe("test");

		act(() => {
			fireEvent.click(screen.getByTestId("header-search-bar__reset"));
		});

		expect(input.value).not.toBe("test");
		expect(onReset).toHaveBeenCalled();
	});

	it("should call onSearch", async () => {
		jest.useFakeTimers();

		const onSearch = jest.fn();

		render(<HeaderSearchBar onSearch={onSearch} />);

		fireEvent.click(screen.getByRole("button"));

		act(() => {
			fireEvent.change(screen.getByTestId("Input"), {
				target: {
					value: "test",
				},
			});
		});

		await act(async () => {
			jest.runAllTimers();
		});

		expect(onSearch).toHaveBeenCalled();
	});

	it("should set custom debounce timeout form props", async () => {
		jest.useFakeTimers();

		const onSearch = jest.fn();

		render(<HeaderSearchBar onSearch={onSearch} debounceTimeout={100} />);

		fireEvent.click(screen.getByRole("button"));

		act(() => {
			fireEvent.change(screen.getByTestId("Input"), {
				target: {
					value: "test",
				},
			});
		});

		await act(async () => {
			jest.runAllTimers();
		});

		expect(onSearch).toHaveBeenCalled();
	});
});
