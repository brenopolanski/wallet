import { renderHook } from "@testing-library/react-hooks";
import { EnvironmentProvider } from "app/contexts";
import React from "react";
import { env } from "utils/testing-library";

import { useNetworkOptions } from "./use-network-options";

describe("useNetworkOptions hook", () => {
	it("should return network options", () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children}</EnvironmentProvider>;
		const { result } = renderHook(() => useNetworkOptions(), { wrapper });

		const networks = result.current.networkOptions;

		expect(networks).toContainEqual({ isTestNetwork: false, label: "ARK", value: "ark.mainnet" });
		expect(networks).not.toContainEqual({ isTestNetwork: true, label: "ARK Devnet", value: "ark.devnet" });
		expect(networks).toContainEqual({ isTestNetwork: false, label: "Compendia", value: "bind.mainnet" });
	});

	it("should return network options including test networks", () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children}</EnvironmentProvider>;
		const { result } = renderHook(() => useNetworkOptions(true), { wrapper });

		const networks = result.current.networkOptions;

		expect(networks).toContainEqual({ isTestNetwork: false, label: "ARK", value: "ark.mainnet" });
		expect(networks).toContainEqual({ isTestNetwork: true, label: "ARK Devnet", value: "ark.devnet" });
		expect(networks).toContainEqual({ isTestNetwork: false, label: "Compendia", value: "bind.mainnet" });
	});

	it("should get a network by its id", () => {
		const id = "ark.mainnet";

		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const { result } = renderHook(() => useNetworkOptions(), { wrapper });

		const network = result.current.networkById(id);

		expect(network?.id()).toBe(id);
	});
});
