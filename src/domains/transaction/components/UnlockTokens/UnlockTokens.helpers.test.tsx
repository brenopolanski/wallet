import { BigNumber } from "@payvo/sdk-helpers";
import { DateTime } from "@payvo/sdk-intl";
import { Contracts } from "@payvo/sdk-profiles";
import { act, renderHook } from "@testing-library/react-hooks";
import { toasts } from "app/services";
import { UnlockTokensFetchError } from "domains/transaction/components/UnlockTokens/blocks/UnlockTokensFetchError";
import React from "react";
import { env, getDefaultProfileId } from "utils/testing-library";

import { POLLING_INTERVAL } from "./UnlockTokens.contracts";
import { useUnlockableBalances, useUnlockTokensSelectTableColumns } from "./UnlockTokens.helpers";

describe("useUnlockableBalances", () => {
	let wallet: Contracts.IReadWriteWallet;

	beforeAll(() => {
		jest.useFakeTimers();

		const profile = env.profiles().findById(getDefaultProfileId());

		wallet = profile.wallets().first();
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	it("should fetch unlockable balances every 60 seconds", async () => {
		const unlockableBalances = jest.spyOn(wallet.coin().client(), "unlockableBalances").mockResolvedValue({
			current: BigNumber.make(30),
			objects: [
				{
					address: "lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4",
					amount: BigNumber.make(30),
					height: "789",
					isReady: true,
					timestamp: DateTime.make("2020-01-01T00:00:00.000Z"),
				},
			],
			pending: BigNumber.make(0),
		});

		const { result, waitForNextUpdate } = renderHook(() => useUnlockableBalances(wallet));

		await waitForNextUpdate();

		expect(unlockableBalances).toHaveBeenCalledTimes(1);
		expect(result.current.items).toHaveLength(1);
		expect(result.current.isFirstLoad).toBe(true);

		act(() => {
			jest.advanceTimersByTime(POLLING_INTERVAL + 500);
		});

		await waitForNextUpdate();

		expect(unlockableBalances).toHaveBeenCalledTimes(2);
		expect(result.current.isFirstLoad).toBe(false);

		unlockableBalances.mockRestore();
	});

	it("should handle fetch error and retry", async () => {
		const unlockableBalances = jest
			.spyOn(wallet.coin().client(), "unlockableBalances")
			.mockImplementation(() => Promise.reject(new Error("unable to fetch")));

		const toastWarning = jest.spyOn(toasts, "warning").mockImplementation();

		const { result, waitForNextUpdate } = renderHook(() => useUnlockableBalances(wallet));

		await waitForNextUpdate();

		expect(result.current.items).toHaveLength(0);
		expect(unlockableBalances).toHaveBeenCalledWith(wallet.address());
		expect(toastWarning).toHaveBeenCalledWith(<UnlockTokensFetchError onRetry={expect.any(Function)} />);

		unlockableBalances.mockRestore();
		toastWarning.mockRestore();
	});

	it("should return items sorted by date desc", async () => {
		const unlockableBalances = jest.spyOn(wallet.coin().client(), "unlockableBalances").mockResolvedValue({
			current: BigNumber.make(30),
			objects: [
				{
					address: "lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4",
					amount: BigNumber.make(1),
					height: "1",
					isReady: true,
					timestamp: DateTime.make("2020-01-01T00:00:00.000Z"),
				},
				{
					address: "lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4",
					amount: BigNumber.make(3),
					height: "3",
					isReady: true,
					timestamp: DateTime.make("2020-03-01T00:00:00.000Z"),
				},
				{
					address: "lsk5gjpsoqgchb8shk8hvwez6ddx3a4b8gga59rw4",
					amount: BigNumber.make(2),
					height: "2",
					isReady: true,
					timestamp: DateTime.make("2020-02-01T00:00:00.000Z"),
				},
			],
			pending: BigNumber.make(0),
		});

		const { result, waitForNextUpdate } = renderHook(() => useUnlockableBalances(wallet));

		await waitForNextUpdate();

		expect(unlockableBalances).toHaveBeenCalledTimes(1);
		expect(result.current.items).toHaveLength(3);
		expect(result.current.items[0].timestamp.format("MM")).toBe("03");
		expect(result.current.items[1].timestamp.format("MM")).toBe("02");
		expect(result.current.items[2].timestamp.format("MM")).toBe("01");

		unlockableBalances.mockRestore();
	});
});

describe("useUnlockTokensSelectTableColumns", () => {
	it("should return columns", () => {
		const { result } = renderHook(() => useUnlockTokensSelectTableColumns(false, false, jest.fn()));

		expect(result.current).toHaveLength(3);

		expect(result.current[0].id).toBe("amount");
		expect(result.current[1].id).toBe("time");
		expect(result.current[2].id).toBe("status");
	});
});
