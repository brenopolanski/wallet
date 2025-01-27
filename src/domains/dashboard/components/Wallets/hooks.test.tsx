/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import { renderHook } from "@testing-library/react-hooks";
import { EnvironmentProvider } from "app/contexts";
import nock from "nock";
import React from "react";
import { env, getDefaultProfileId, MNEMONICS, syncDelegates } from "utils/testing-library";

import { useWalletDisplay } from "./hooks";

let profile: Contracts.IProfile;
let wallets: Contracts.IReadWriteWallet[];

describe("useWalletDisplay", () => {
	beforeAll(async () => {
		nock("https://neoscan.io/api/main_net/v1/")
			.get("/get_last_transactions_by_address/AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX/1")
			.reply(200, []);

		profile = env.profiles().findById(getDefaultProfileId());
		await env.profiles().restore(profile);
		await profile.sync();

		const wallet = await profile.walletFactory().fromAddress({
			address: "AdVSe37niA3uFUPgCgMUH2tMsHF4LpLoiX",
			coin: "ARK",
			network: "ark.mainnet",
		});

		profile.wallets().push(wallet);
		await syncDelegates(profile);

		wallets = profile.wallets().values();
	});

	it("should return empty wallets", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const { result } = renderHook(() => useWalletDisplay({ selectedNetworkIds: ["ark.devnet"] }), {
			wrapper,
		});

		expect(result.current.listWallets).toHaveLength(0);
	});

	it("should return list type wallets", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const { result } = renderHook(() => useWalletDisplay({ selectedNetworkIds: ["ark.devnet"], wallets }), {
			wrapper,
		});

		expect(result.current.listWallets).toHaveLength(2);
		expect(result.current.listHasMore).toBe(false);
	});

	it("should limit list type wallets", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const { result } = renderHook(
			() =>
				useWalletDisplay({
					listPagerLimit: 1,
					selectedNetworkIds: ["ark.devnet", "ark.mainnet"],
					viewMore: true,
					wallets,
				}),
			{
				wrapper,
			},
		);

		expect(result.current.listWallets).toHaveLength(3);
	});

	it("should ignore list pager limit", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const { result } = renderHook(
			() =>
				useWalletDisplay({
					listPagerLimit: 1,
					selectedNetworkIds: ["ark.devnet", "ark.mainnet"],
					viewMore: true,
					wallets,
				}),
			{
				wrapper,
			},
		);

		expect(result.current.listWallets).toHaveLength(3);
	});

	it("should filter wallets by selectedNetworkIds", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const { result } = renderHook(() => useWalletDisplay({ selectedNetworkIds: [], wallets }), {
			wrapper,
		});

		expect(result.current.listWallets).toHaveLength(0);
	});

	it("should return listHasMore boolean", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const { result } = renderHook(
			() => useWalletDisplay({ listPagerLimit: 1, selectedNetworkIds: ["ark.devnet"], viewMore: false, wallets }),
			{
				wrapper,
			},
		);

		expect(result.current.listHasMore).toBe(true);
	});

	it("should filter wallet types", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const { result } = renderHook(
			() =>
				useWalletDisplay({
					displayType: "starred",
					selectedNetworkIds: ["ark.devnet", "ark.mainnet"],
					wallets,
				}),
			{
				wrapper,
			},
		);

		expect(result.current.listWallets).toHaveLength(0);
	});

	it("should return 2 grid wallet padded with 1 additional empty grid wallet", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const { result } = renderHook(() => useWalletDisplay({ selectedNetworkIds: ["ark.devnet"], wallets }), {
			wrapper,
		});

		expect(result.current.gridWallets).toHaveLength(3);
	});

	it("should return all grid wallets", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;

		const testWallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});
		const test2Wallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[1],
			network: "ark.devnet",
		});

		const ledger = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[2],
			network: "ark.devnet",
		});

		profile.wallets().push(testWallet);
		profile.wallets().push(test2Wallet);
		profile.wallets().push(ledger);

		const ledgerMock = jest.spyOn(ledger, "isLedger").mockReturnValue(true);

		const { result } = renderHook(
			() =>
				useWalletDisplay({
					selectedNetworkIds: ["ark.devnet", "ark.mainnet"],
					wallets: profile.wallets().values(),
				}),
			{
				wrapper,
			},
		);

		expect(result.current.gridWallets).toHaveLength(6);

		ledgerMock.mockRestore();
	});

	it("should filter ledger grid wallets", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}> {children} </EnvironmentProvider>;
		const ledger = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[4],
			network: "ark.devnet",
		});

		profile.wallets().push(ledger);

		const ledgerMock = jest.spyOn(ledger, "isLedger").mockReturnValue(true);

		const { result } = renderHook(
			() =>
				useWalletDisplay({
					displayType: "ledger",
					selectedNetworkIds: ["ark.devnet", "ark.mainnet"],
					wallets: profile.wallets().values(),
				}),
			{
				wrapper,
			},
		);

		expect(result.current.gridWallets).toHaveLength(3);

		ledgerMock.mockRestore();
	});

	it("should return a value that indicates if there are wallets for networks that are not selected", async () => {
		const wrapper = ({ children }: any) => <EnvironmentProvider env={env}>{children}</EnvironmentProvider>;
		const { result: resultAll } = renderHook(
			() =>
				useWalletDisplay({
					displayType: "all",
					selectedNetworkIds: ["ark.devnet"],
					wallets,
				}),
			{
				wrapper,
			},
		);

		expect(resultAll.current.hasWalletsMatchingOtherNetworks).toBeTruthy();

		const { result: resultStarred } = renderHook(
			() =>
				useWalletDisplay({
					displayType: "starred",
					selectedNetworkIds: ["ark.devnet"],
					wallets,
				}),
			{
				wrapper,
			},
		);

		expect(resultStarred.current.hasWalletsMatchingOtherNetworks).toBeFalsy();

		const { result: resultLedger } = renderHook(
			() =>
				useWalletDisplay({
					displayType: "starred",
					selectedNetworkIds: ["ark.devnet"],
					wallets,
				}),
			{
				wrapper,
			},
		);

		expect(resultLedger.current.hasWalletsMatchingOtherNetworks).toBeFalsy();

		const { result: resultWithMainnet } = renderHook(
			() =>
				useWalletDisplay({
					displayType: "all",
					selectedNetworkIds: ["ark.devnet", "ark.mainnet"],
					wallets,
				}),
			{
				wrapper,
			},
		);

		expect(resultWithMainnet.current.hasWalletsMatchingOtherNetworks).toBeFalsy();
	});
});
