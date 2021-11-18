import { Contracts } from "@payvo/sdk-profiles";
import { FilterOption } from "app/components/FilterNetwork";
import { DashboardConfiguration } from "domains/dashboard/pages/Dashboard";
import React from "react";
import { env, fireEvent, getDefaultProfileId, render } from "utils/testing-library";

import { FilterWallets } from "./FilterWallets";

let profile: Contracts.IProfile;
let networkOptions: FilterOption[];

const defaultConfiguration: DashboardConfiguration = {
	selectedNetworkIds: [],
	viewType: "grid",
	walletsDisplayType: "all",
};

describe("FilterWallets", () => {
	beforeAll(() => {
		profile = env.profiles().findById(getDefaultProfileId());

		const networks: Record<string, FilterOption> = {};

		for (const wallet of profile.wallets().values()) {
			const networkId = wallet.networkId();

			if (!networks[networkId]) {
				networks[networkId] = {
					isSelected: false,
					network: wallet.network(),
				};
			}
		}

		networkOptions = Object.values(networks);
	});

	it("should render", () => {
		const { container } = render(<FilterWallets defaultConfiguration={defaultConfiguration} />);

		expect(container).toMatchSnapshot();
	});

	it("should render with networks selection", () => {
		const { container } = render(
			<FilterWallets networks={networkOptions} useTestNetworks defaultConfiguration={defaultConfiguration} />,
		);

		expect(container).toMatchSnapshot();
	});

	it("should emit onChange for network selection", () => {
		const onChange = jest.fn();

		const { getByTestId } = render(
			<FilterWallets
				networks={networkOptions}
				onChange={onChange}
				useTestNetworks
				defaultConfiguration={defaultConfiguration}
			/>,
		);

		fireEvent.click(getByTestId(`NetworkOption__${networkOptions[0].network.id()}`));

		expect(onChange).toHaveBeenCalledWith("selectedNetworkIds", [networkOptions[0].network.id()]);
	});

	it("should emit onChange for wallets display type change", () => {
		const onChange = jest.fn();

		const { getByTestId } = render(
			<FilterWallets networks={networkOptions} onChange={onChange} defaultConfiguration={defaultConfiguration} />,
		);

		fireEvent.click(getByTestId("filter-wallets__wallets"));

		fireEvent.click(getByTestId("dropdown__option--0"));

		expect(onChange).toHaveBeenCalledWith("walletsDisplayType", "all");
	});

	it("should not emit onChange for wallet display type change", () => {
		const onChange = jest.fn();

		const { getByTestId } = render(
			<FilterWallets networks={networkOptions} defaultConfiguration={defaultConfiguration} />,
		);

		fireEvent.click(getByTestId("filter-wallets__wallets"));

		fireEvent.click(getByTestId("dropdown__option--0"));

		expect(onChange).not.toHaveBeenCalled();
	});
});
