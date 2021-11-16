import userEvent from "@testing-library/user-event";
import { Networks } from "@payvo/sdk";
import React from "react";
import { env, fireEvent, render, waitFor, within } from "utils/testing-library";

import { FilterNetwork, FilterNetworks, FilterOption, NetworkOptions, ToggleAllOption } from ".";

let networkOptions: FilterOption[];

describe("NetworkOptions", () => {
	beforeAll(() => {
		networkOptions = env.availableNetworks().map((network: Networks.Network) => ({
			isSelected: false,
			network,
		}));
	});

	it("should render empty", () => {
		const { container } = render(<NetworkOptions networks={[]} onClick={jest.fn()} />);

		expect(container).toMatchSnapshot();
	});

	it("should render available networks options", () => {
		const { container } = render(<NetworkOptions networks={networkOptions} onClick={jest.fn()} />);

		expect(container).toMatchSnapshot();
	});

	it("should trigger onClick", () => {
		const onClick = jest.fn();
		const { getByTestId } = render(<NetworkOptions networks={networkOptions} onClick={onClick} />);
		userEvent.click(getByTestId(`NetworkOption__${networkOptions[0].network.id()}`));

		expect(onClick).toHaveBeenCalledWith(
			{
				isSelected: false,
				network: networkOptions[0].network,
			},
			expect.anything(),
		);
	});
});

describe("ToggleAllOption", () => {
	it("should render", () => {
		const { container } = render(<ToggleAllOption />);

		expect(container).toMatchSnapshot();
	});

	it("should render hidden", () => {
		const { container } = render(<ToggleAllOption isHidden />);

		expect(container).toMatchSnapshot();
	});

	it("should render selected", () => {
		const { container } = render(<ToggleAllOption isSelected />);

		expect(container).toMatchSnapshot();
	});

	it("should handle onClick", () => {
		const onClick = jest.fn();
		const { getByTestId } = render(<ToggleAllOption isSelected onClick={onClick} />);
		userEvent.click(getByTestId("network__viewall"));

		expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});
});

describe("FilterNetwork", () => {
	beforeAll(() => {
		networkOptions = env.availableNetworks().map((network: Networks.Network) => ({
			isSelected: false,
			network,
		}));
	});

	it("should render empty", () => {
		const { container } = render(<FilterNetwork />);

		expect(container).toMatchSnapshot();
	});

	it("should render public networks", () => {
		const { container, getAllByTestId } = render(<FilterNetwork options={networkOptions} />);

		expect(getAllByTestId("FilterNetwork")).toHaveLength(1);
		expect(container).toMatchSnapshot();
	});

	it("should toggle a network option", () => {
		const onChange = jest.fn();
		const { getAllByTestId, getByTestId } = render(<FilterNetwork options={networkOptions} onChange={onChange} />);

		expect(getAllByTestId("FilterNetwork")).toHaveLength(1);

		userEvent.click(getByTestId(`NetworkOption__${networkOptions[0].network.id()}`));

		expect(onChange).toHaveBeenCalledWith(
			{
				isSelected: true,
				network: networkOptions[0].network,
			},
			expect.anything(),
		);
	});
});

describe("FilterNetworks", () => {
	beforeAll(() => {
		networkOptions = env.availableNetworks().map((network: Networks.Network) => ({
			isSelected: false,
			network,
		}));
	});

	it("should render empty", () => {
		const { container } = render(<FilterNetworks />);

		expect(container).toMatchSnapshot();
	});

	it("should render public networks", () => {
		const { container, getAllByTestId } = render(<FilterNetworks options={networkOptions} />);

		expect(getAllByTestId("FilterNetwork")).toHaveLength(1);
		expect(container).toMatchSnapshot();
	});

	it("should render public and testnet networks", () => {
		const { container, getAllByTestId } = render(
			<FilterNetworks useTestNetworks={true} options={networkOptions} />,
		);

		expect(getAllByTestId("FilterNetwork")).toHaveLength(2);
		expect(container).toMatchSnapshot();
	});

	it("should toggle view all", async () => {
		const { container, getAllByTestId, getByTestId, findByTestId } = render(
			<FilterNetworks useTestNetworks={true} options={networkOptions} hideViewAll={false} />,
		);

		expect(getAllByTestId("FilterNetwork")).toHaveLength(2);

		userEvent.click(within(getAllByTestId("FilterNetwork")[0]).getByTestId("network__viewall"));

		await findByTestId("FilterNetwork__select-all-checkbox");

		expect(container).toMatchSnapshot();

		userEvent.click(within(getAllByTestId("FilterNetwork")[0]).getByTestId("network__viewall"));

		await waitFor(() =>
			expect(() => getByTestId("FilterNetwork__select-all-checkbox")).toThrow(/Unable to find an element by/),
		);

		expect(container).toMatchSnapshot();
	});

	it("should select all public networks", async () => {
		const onChange = jest.fn();
		const { getAllByTestId, findAllByTestId } = render(
			<FilterNetworks useTestNetworks={true} options={networkOptions} onChange={onChange} hideViewAll={false} />,
		);

		expect(getAllByTestId("FilterNetwork")).toHaveLength(2);

		userEvent.click(within(getAllByTestId("FilterNetwork")[0]).getByTestId("network__viewall"));

		await findAllByTestId("FilterNetwork__select-all-checkbox");

		userEvent.click(getAllByTestId("FilterNetwork__select-all-checkbox")[0]);

		expect(onChange).toHaveBeenCalledWith(expect.anything(), [
			...networkOptions
				.filter((option) => option.network.isLive())
				.map((option) => ({ ...option, isSelected: true })),
			...networkOptions
				.filter((option) => option.network.isTest())
				.map((option) => ({ ...option, isSelected: false })),
		]);
	});

	it("should toggle a public network option", () => {
		const onChange = jest.fn();
		const { getAllByTestId, getByTestId } = render(<FilterNetworks options={networkOptions} onChange={onChange} />);

		expect(getAllByTestId("FilterNetwork")).toHaveLength(1);

		userEvent.click(getByTestId(`NetworkOption__${networkOptions[0].network.id()}`));

		expect(onChange).toHaveBeenCalledWith(
			{
				isSelected: true,
				network: networkOptions[0].network,
			},
			expect.anything(),
		);
	});

	it("should toggle a testnet network option", () => {
		const onChange = jest.fn();
		const { container, getAllByTestId, getByTestId } = render(
			<FilterNetworks options={networkOptions} onChange={onChange} useTestNetworks />,
		);

		expect(container).toMatchSnapshot();
		expect(getAllByTestId("FilterNetwork")).toHaveLength(2);

		userEvent.click(getByTestId(`NetworkOption__${networkOptions[1].network.id()}`));

		expect(onChange).toHaveBeenCalledWith(
			{
				isSelected: true,
				network: networkOptions[1].network,
			},
			expect.anything(),
		);
	});
});
