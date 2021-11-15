import { Contracts } from "@payvo/sdk-profiles";
import { waitFor } from "@testing-library/react";
import { act as actHook, renderHook } from "@testing-library/react-hooks";
import { EnvironmentProvider } from "app/contexts";
import { PluginManager } from "plugins";
import { PluginManagerProvider } from "plugins/context/PluginManagerProvider";
import React from "react";
import { env, getDefaultProfileId } from "utils/testing-library";

import { usePluginUpdateQueue } from "./use-plugin-update-queue";

describe("Plugin Update Queue", () => {
	let profile: Contracts.IProfile;

	beforeEach(() => {
		jest.useFakeTimers();
		profile = env.profiles().findById(getDefaultProfileId());
	});

	beforeAll(() => {
		jest.useRealTimers();
	});

	it("should work properly", async () => {
		const ids = [{ id: "plugin-1" }, { id: "plugin-2" }, { id: "plugin-3" }];

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<PluginManagerProvider services={[]} manager={new PluginManager()}>
					{children}
				</PluginManagerProvider>
			</EnvironmentProvider>
		);

		const { result } = renderHook(() => usePluginUpdateQueue(profile), { wrapper });

		await actHook(async () => {
			result.current.startUpdate(ids);
			await waitFor(() => expect(result.current.hasInUpdateQueue("plugin-3")).toBe(true));
			await waitFor(() => expect(result.current.hasUpdateComplete("plugin-3")).toBe(false));
			await waitFor(() => expect(result.current.isUpdating).toBe(true));
			await waitFor(() => expect(result.current.isUpdateCompleted).toBe(true));
			await waitFor(() => expect(result.current.hasUpdateComplete("plugin-3")).toBe(true));
		});

		expect(result.current.isUpdating).toBe(false);
		expect(result.current.hasInUpdateQueue("plugin-3")).toBe(false);
	});
});
