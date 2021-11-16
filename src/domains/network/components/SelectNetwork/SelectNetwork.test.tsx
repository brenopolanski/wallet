import userEvent from "@testing-library/user-event";
import React from "react";
import { availableNetworksMock } from "tests/mocks/networks";
import { fireEvent, render, screen, within } from "utils/testing-library";

import { itemToString, SelectNetwork } from "./SelectNetwork";

describe("SelectNetwork", () => {
	it("should render", () => {
		const { container } = render(<SelectNetwork />);

		expect(container).toMatchSnapshot();
	});

	it("should render with networks", () => {
		const { container } = render(<SelectNetwork networks={availableNetworksMock} />);

		expect(container).toMatchSnapshot();
	});

	it("should render with hidden options", () => {
		const { container } = render(<SelectNetwork networks={availableNetworksMock} hideOptions />);

		expect(screen.getByTestId("SelectNetwork__options")).toHaveClass("hidden");
		expect(container).toMatchSnapshot();
	});

	it("should filter the network icons based on the input value", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);
		const input = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.focus(input);

		const availableNetworksLength = availableNetworksMock.filter((network) => network).length;

		expect(screen.getAllByTestId("SelectNetwork__NetworkIcon--container")).toHaveLength(availableNetworksLength);

		const value = "Ar";

		fireEvent.change(input, { target: { value } });

		expect(input).toHaveValue(value);

		expect(screen.getByTestId("NetworkIcon-ARK-ark.devnet")).toBeInTheDocument();
		expect(screen.getByTestId("NetworkIcon-ARK-ark.mainnet")).toBeInTheDocument();

		fireEvent.change(input, { target: { value: "" } });

		expect(input).not.toHaveValue();

		expect(screen.getAllByTestId("SelectNetwork__NetworkIcon--container")).toHaveLength(availableNetworksLength);
	});

	it("should show suggestion when typing has found at least one match", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);
		const input = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(input, { target: { value: "ar" } });

		expect(input).toHaveValue("ar");

		expect(screen.getByTestId("Input__suggestion")).toHaveTextContent("arK");
	});

	it("should show call onInputChange callback when input value changed", () => {
		const onInputChange = jest.fn();

		render(<SelectNetwork networks={availableNetworksMock} onInputChange={onInputChange} />);
		const input = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(input, { target: { value: "ark" } });

		expect(input).toHaveValue("ark");

		expect(onInputChange).toHaveBeenCalledWith("ark", "ark");

		fireEvent.change(input, { target: { value: "no-match" } });

		expect(input).toHaveValue("no-match");

		expect(onInputChange).toHaveBeenCalledWith("no-match", "");

		fireEvent.change(input, { target: { value: "" } });

		expect(input).not.toHaveValue();

		expect(onInputChange).toHaveBeenCalledWith();
	});

	it("should select first matching asset with enter", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);
		const input = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(input, { target: { value: "ark" } });

		expect(input).toHaveValue("ark");

		fireEvent.keyDown(input, { code: 13, key: "Enter" });

		expect(screen.getByTestId("SelectNetworkInput__network")).toHaveAttribute("aria-label", "ARK");
	});

	it("should not select non-matching asset after key input and enter", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);
		const input = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(input, { target: { value: "Bot" } });

		expect(input).toHaveValue("Bot");

		fireEvent.keyDown(input, { code: 13, key: "Enter" });

		expect(within(screen.getByTestId("SelectNetworkInput__network")).queryByTestId("CoinIcon")).toBeNull();
	});

	it("should not select first matched asset after random key enter", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);
		const input = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(input, { target: { value: "Bitco" } });

		expect(input).toHaveValue("Bitco");

		fireEvent.keyDown(input, { code: 65, key: "A" });

		expect(within(screen.getByTestId("SelectNetworkInput__network")).queryByTestId("CoinIcon")).toBeNull();
	});

	it("should clear selection when changing input", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);
		const input = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.change(input, { target: { value: "ark" } });

		expect(input).toHaveValue("ark");

		fireEvent.keyDown(input, { code: 13, key: "Enter" });

		expect(screen.getByTestId("SelectNetworkInput__network")).toHaveAttribute("aria-label", "ARK");

		fireEvent.change(input, { target: { value: "test" } });

		expect(input).not.toHaveValue();

		fireEvent.keyDown(input, { code: 65, key: "A" });

		expect(input).not.toHaveValue();

		fireEvent.keyDown(input, { code: 65, key: "B" });

		expect(input).not.toHaveValue();

		expect(within(screen.getByTestId("SelectNetworkInput__network")).queryByTestId("CoinIcon")).toBeNull();
	});

	it("should select an item by clicking on it", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);
		const input = screen.getByTestId("SelectNetworkInput__input");

		fireEvent.focus(input);

		fireEvent.change(input, { target: { value: "ARK" } });

		expect(input).toHaveValue("ARK");
		expect(screen.getByTestId("Input__suggestion")).toBeInTheDocument();
		expect(screen.getByTestId("NetworkIcon-ARK-ark.mainnet")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("NetworkIcon-ARK-ark.mainnet"));

		expect(screen.queryByTestId("Input__suggestion")).not.toBeInTheDocument();
		expect(screen.getByTestId("SelectNetworkInput__network")).toHaveAttribute("aria-label", "ARK");
		expect(screen.getByTestId("NetworkIcon-ARK-ark.devnet")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("NetworkIcon-ARK-ark.devnet"));

		expect(screen.getByTestId("SelectNetworkInput__network")).toHaveAttribute("aria-label", "ARK Devnet");
	});

	it("should toggle selection by clicking on network icon", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);

		fireEvent.focus(screen.getByTestId("SelectNetworkInput__input"));

		expect(screen.getByTestId("NetworkIcon-ARK-ark.mainnet")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("NetworkIcon-ARK-ark.mainnet"));

		expect(screen.getByTestId("SelectNetworkInput__network")).toHaveAttribute("aria-label", "ARK");

		fireEvent.focus(screen.getByTestId("SelectNetworkInput__input"));

		expect(screen.getByTestId("NetworkIcon-ARK-ark.mainnet")).toBeInTheDocument();

		userEvent.click(screen.getByTestId("NetworkIcon-ARK-ark.mainnet"));

		expect(screen.getByTestId("SelectNetworkInput__network")).not.toHaveAttribute("aria-label");
	});

	it("should show and hide development networks through toggle", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);

		expect(screen.getAllByRole("listbox")[1]).toHaveClass("hidden");

		userEvent.click(screen.getByTestId("SelectNetwork__developmentNetworks-toggle"));

		expect(screen.getAllByRole("listbox")[1]).not.toHaveClass("hidden");

		userEvent.click(screen.getByTestId("SelectNetwork__developmentNetworks-toggle"));

		expect(screen.getAllByRole("listbox")[1]).toHaveClass("hidden");
	});

	it("should show development networks if selected through input", () => {
		render(<SelectNetwork networks={availableNetworksMock} />);
		const input = screen.getByTestId("SelectNetworkInput__input");

		expect(screen.getAllByRole("listbox")[1]).toHaveClass("hidden");

		fireEvent.change(input, { target: { value: "ARK D" } });

		expect(input).toHaveValue("ARK D");

		fireEvent.keyDown(input, { code: 13, key: "Enter" });

		expect(screen.getAllByRole("listbox")[1]).not.toHaveClass("hidden");
	});

	it("should return empty if the item has not defined", () => {
		expect(itemToString(null)).toBe("");
	});
});
