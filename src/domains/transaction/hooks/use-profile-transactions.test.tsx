/* eslint-disable @typescript-eslint/require-await */
import { act as hookAct, renderHook } from "@testing-library/react-hooks";
import { ConfigurationProvider, EnvironmentProvider } from "app/contexts";
import nock from "nock";
import React from "react";
import { act, env, getDefaultProfileId, syncDelegates, useDefaultNetMocks, waitFor } from "utils/testing-library";

import { useProfileTransactions } from "./use-profile-transactions";

describe("useProfileTransactions", () => {
	beforeAll(async () => {
		useDefaultNetMocks();

		nock("https://ark-test.payvo.com")
			.get("/api/transactions")
			.query(true)
			.reply(200, () => require("tests/fixtures/coins/ark/devnet/transactions.json"))
			.persist();
	});

	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.clearAllTimers();
	});

	it("should run updates periodically", async () => {
		let hook: any;

		const profile = env.profiles().findById(getDefaultProfileId());

		await syncDelegates(profile);

		await env.profiles().restore(profile);
		await profile.sync();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const all = await profile.transactionAggregate().all({});
		const items = all.items();

		const mockDefaultTransactions = jest.spyOn(profile.transactionAggregate(), "all").mockImplementation(() => {
			const response = {
				hasMorePages: () => false,
				items: () => items,
			};
			return Promise.resolve(response);
		});

		hook = renderHook(() => useProfileTransactions({ profile, wallets: profile.wallets().values() }), {
			wrapper,
		});

		mockDefaultTransactions.mockRestore();

		jest.advanceTimersByTime(30_000);

		await hook.waitForNextUpdate();

		await waitFor(() => expect(hook.result.current.transactions).toHaveLength(30));

		const mockTransactionsAggregate = jest.spyOn(profile.transactionAggregate(), "all").mockResolvedValue({
			hasMorePages: () => false,
			items: () => items,
		} as any);

		hook = renderHook(() => useProfileTransactions({ profile, wallets: profile.wallets().values() }), {
			wrapper,
		});

		jest.advanceTimersByTime(30_000);

		await hook.waitForNextUpdate();

		const distinctAddresses = [...new Set(items.map((item) => item.wallet().address()))];

		expect(mockTransactionsAggregate).toHaveBeenCalledWith({
			identifiers: distinctAddresses.map((address) => ({
				type: "address",
				value: address,
			})),
			limit: 30,
		});

		await waitFor(() => expect(hook.result.current.transactions).toHaveLength(items.length));

		mockTransactionsAggregate.mockRestore();

		const mockEmptyTransactions = jest.spyOn(profile.transactionAggregate(), "all").mockResolvedValue({
			hasMorePages: () => false,
			items: () => [],
		} as any);

		hook = renderHook(() => useProfileTransactions({ profile, wallets: profile.wallets().values() }), {
			wrapper,
		});

		jest.advanceTimersByTime(30_000);

		await hook.waitForNextUpdate();

		await waitFor(() => expect(hook.result.current.transactions).toHaveLength(0));

		mockEmptyTransactions.mockRestore();
		jest.clearAllTimers();
	});

	it("#fetchTransactions", async () => {
		const profile = env.profiles().findById(getDefaultProfileId());

		await syncDelegates(profile);

		await env.profiles().restore(profile);
		await profile.sync();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const {
			result: { current },
		} = renderHook(() => useProfileTransactions({ profile, wallets: profile.wallets().values() }), { wrapper });

		const response = await current.fetchTransactions({
			cursor: 1,
			flush: true,
			mode: "all",
			wallets: profile.wallets().values(),
		});
		await waitFor(() => expect(response.items()).toHaveLength(30));

		//@ts-ignore
		const responseEmpty = await current.fetchTransactions({});
		await waitFor(() => expect(responseEmpty.hasMorePages()).toBe(false));
		await waitFor(() => expect(responseEmpty.items()).toHaveLength(0));
	});

	it("#updateFilters", async () => {
		const profile = env.profiles().findById(getDefaultProfileId());

		await syncDelegates(profile);

		await env.profiles().restore(profile);
		await profile.sync();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const { result, waitForNextUpdate } = renderHook(
			() => useProfileTransactions({ profile, wallets: profile.wallets().values() }),
			{
				wrapper,
			},
		);

		hookAct(() => {
			result.current.updateFilters({ activeMode: "sent" });
		});

		hookAct(() => {
			result.current.updateFilters({ activeMode: "sent" });
		});

		act(() => {
			jest.runOnlyPendingTimers();
		});

		await waitForNextUpdate();

		await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

		act(() => {
			jest.clearAllTimers();
		});

		hookAct(() => {
			result.current.updateFilters({ activeMode: "all" });
		});

		act(() => {
			jest.runOnlyPendingTimers();
		});

		await waitForNextUpdate();

		await waitFor(() => expect(result.current.isLoadingMore).toBe(false));
		await waitFor(() => expect(result.current.transactions).toHaveLength(30));

		const mockEmpty = jest.spyOn(profile.transactionAggregate(), "sent").mockResolvedValue({
			hasMorePages: () => false,
			items: () => [],
		} as any);

		hookAct(() => {
			result.current.updateFilters({ activeMode: "sent" });
		});

		act(() => {
			jest.runOnlyPendingTimers();
		});

		act(() => {
			jest.runOnlyPendingTimers();
		});

		await waitForNextUpdate();

		await waitFor(() => expect(result.current.transactions).toHaveLength(0));
		await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

		mockEmpty.mockRestore();
	});

	it("should hide unconfirmed transactions", async () => {
		const profile = env.profiles().findById(getDefaultProfileId());

		await syncDelegates(profile);

		await env.profiles().restore(profile);
		await profile.sync();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const sent = await profile.transactionAggregate().all({ limit: 30 });
		const items = sent.items();

		const mockIsConfirmed = jest.spyOn(items[0], "isConfirmed").mockReturnValue(false);

		const mockTransactionsAggregate = jest.spyOn(profile.transactionAggregate(), "all").mockResolvedValue({
			hasMorePages: () => true,
			items: () => items,
		} as any);

		const { result, waitForNextUpdate } = renderHook(
			() => useProfileTransactions({ profile, wallets: profile.wallets().values() }),
			{ wrapper },
		);

		await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

		hookAct(() => {
			result.current.updateFilters({ activeMode: "all" });
		});

		await waitFor(() => expect(result.current.isLoadingMore).toBe(false));

		act(() => {
			jest.runOnlyPendingTimers();
		});

		await waitForNextUpdate();
		await waitFor(() => expect(result.current.transactions).toHaveLength(items.length));

		mockTransactionsAggregate.mockRestore();
		mockIsConfirmed.mockRestore();
	});

	it("#fetchMore", async () => {
		const profile = env.profiles().findById(getDefaultProfileId());

		await syncDelegates(profile);

		await env.profiles().restore(profile);
		await profile.sync();

		const wrapper = ({ children }: any) => (
			<EnvironmentProvider env={env}>
				<ConfigurationProvider>{children}</ConfigurationProvider>
			</EnvironmentProvider>
		);

		const { result } = renderHook(() => useProfileTransactions({ profile, wallets: profile.wallets().values() }), {
			wrapper,
		});

		await waitFor(() =>
			expect(result.current.fetchTransactions({ wallets: profile.wallets().values() })).resolves.toBeTruthy(),
		);

		await hookAct(async () => {
			await result.current.fetchMore();

			await waitFor(() => expect(result.current.transactions).toHaveLength(30), { timeout: 4000 });
		});

		const mockTransactionsAggregate = jest.spyOn(profile.transactionAggregate(), "all").mockResolvedValue({
			hasMorePages: () => false,
			items: () => [],
		} as any);

		await hookAct(async () => {
			await result.current.fetchMore();
			await waitFor(() => expect(result.current.transactions).toHaveLength(30), { timeout: 4000 });
		});

		mockTransactionsAggregate.mockRestore();
	});
});
