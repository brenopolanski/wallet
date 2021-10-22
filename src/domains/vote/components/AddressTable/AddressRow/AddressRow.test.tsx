/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/profiles";
// @README: This import is fine in tests but should be avoided in production code.
import { ReadOnlyWallet } from "@payvo/profiles/distribution/read-only-wallet";
import nock from "nock";
import React from "react";
import { Route } from "react-router-dom";
import { data } from "tests/fixtures/coins/ark/devnet/delegates.json";
import walletMock from "tests/fixtures/coins/ark/devnet/wallets/D8rr7B1d6TL6pf14LgMz4sKp1VBMs6YUYD.json";
import {
	act,
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	renderWithRouter,
	syncDelegates,
	waitFor,
} from "utils/testing-library";

import { AddressRow } from "./AddressRow";

let profile: Contracts.IProfile;
let wallet: Contracts.IReadWriteWallet;
let blankWallet: Contracts.IReadWriteWallet;
let unvotedWallet: Contracts.IReadWriteWallet;

let emptyProfile: Contracts.IProfile;
let wallet2: Contracts.IReadWriteWallet;

const blankWalletPassphrase = "power return attend drink piece found tragic fire liar page disease combine";

describe("AddressRow", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");
		wallet.data().set(Contracts.WalletFlag.Starred, true);
		wallet.data().set(Contracts.WalletData.DerivationPath, "0");

		blankWallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: blankWalletPassphrase,
			network: "ark.devnet",
		});
		profile.wallets().push(blankWallet);

		unvotedWallet = await profile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[0],
			network: "ark.devnet",
		});
		profile.wallets().push(unvotedWallet);

		emptyProfile = env.profiles().findById("cba050f1-880f-45f0-9af9-cfe48f406052");

		wallet2 = await emptyProfile.walletFactory().fromMnemonicWithBIP39({
			coin: "ARK",
			mnemonic: MNEMONICS[1],
			network: "ark.devnet",
		});
		profile.wallets().push(wallet2);

		nock.disableNetConnect();

		nock("https://ark-test.payvo.com")
			.get("/api/delegates")
			.query({ page: "1" })
			.reply(200, require("tests/fixtures/coins/ark/devnet/delegates.json"))
			.get(`/api/wallets/${unvotedWallet.address()}`)
			.reply(200, walletMock)
			.get(`/api/wallets/${blankWallet.address()}`)
			.reply(404, {
				error: "Not Found",
				message: "Wallet not found",
				statusCode: 404,
			})
			.get(`/api/wallets/${wallet2.address()}`)
			.reply(404, {
				error: "Not Found",
				message: "Wallet not found",
				statusCode: 404,
			})
			.persist();

		await syncDelegates(profile);
		await wallet.synchroniser().votes();
		await wallet.synchroniser().identity();
		await wallet.synchroniser().coin();
	});

	it.each([true, false])("should render when isCompact = %s", async (isCompact: boolean) => {
		const { asFragment, container, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/votes">
				<table>
					<tbody>
						<AddressRow index={0} maxVotes={1} wallet={wallet} isCompact={isCompact} />
					</tbody>
				</table>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/votes`],
			},
		);

		expect(container).toBeTruthy();

		await waitFor(() => expect(getByTestId("StatusIcon__icon")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it.each([true, false])(
		"should render with isCompact = %s when the maximum votes is greater than 1",
		(isCompact: boolean) => {
			const votesMock = jest.spyOn(wallet.voting(), "current").mockReturnValue(
				[0, 1, 2, 3].map((index) => ({
					amount: 0,
					wallet: new ReadOnlyWallet({
						address: data[index].address,
						explorerLink: "",
						governanceIdentifier: "address",
						isDelegate: true,
						isResignedDelegate: false,
						publicKey: data[index].publicKey,
						username: data[index].username,
					}),
				})),
			);

			const { asFragment, container } = renderWithRouter(
				<Route path="/profiles/:profileId/votes">
					<table>
						<tbody>
							<AddressRow index={0} maxVotes={10} wallet={wallet} isCompact={isCompact} />
						</tbody>
					</table>
				</Route>,
				{
					routes: [`/profiles/${profile.id()}/votes`],
				},
			);

			expect(container).toBeTruthy();
			expect(asFragment()).toMatchSnapshot();

			votesMock.mockRestore();
		},
	);

	it.each([true, false])("should render with isCompact = %s when the wallet has many votes", (isCompact: boolean) => {
		const votesMock = jest.spyOn(wallet.voting(), "current").mockReturnValue(
			[0, 1, 2, 3, 4].map((index) => ({
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: data[index].address,
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: false,
					publicKey: data[index].publicKey,
					username: data[index].username,
				}),
			})),
		);

		const { asFragment, container } = renderWithRouter(
			<Route path="/profiles/:profileId/votes">
				<table>
					<tbody>
						<AddressRow index={0} maxVotes={10} wallet={wallet} isCompact={isCompact} />
					</tbody>
				</table>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/votes`],
			},
		);

		expect(container).toBeTruthy();
		expect(asFragment()).toMatchSnapshot();

		votesMock.mockRestore();
	});

	it("should render for a multisignature wallet", async () => {
		const isMultiSignatureSpy = jest.spyOn(wallet, "isMultiSignature").mockImplementation(() => true);
		const { asFragment, container, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/votes">
				<table>
					<tbody>
						<AddressRow index={0} maxVotes={1} wallet={wallet} />
					</tbody>
				</table>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/votes`],
			},
		);

		expect(container).toBeTruthy();

		await waitFor(() => expect(getByTestId("StatusIcon__icon")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();

		isMultiSignatureSpy.mockRestore();
	});

	it("should render when wallet not found for votes", async () => {
		const { asFragment, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/votes">
				<table>
					<tbody>
						<AddressRow index={0} maxVotes={1} wallet={wallet} />
						<AddressRow index={1} maxVotes={1} wallet={blankWallet} />
					</tbody>
				</table>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/votes`],
			},
		);

		await waitFor(() => expect(getByTestId("StatusIcon__icon")).toBeTruthy());
		await waitFor(() => expect(getByTestId("AddressRow__select-0")).toBeTruthy());
		await waitFor(() => expect(getByTestId("AddressRow__select-1")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render when wallet hasn't voted", async () => {
		const { asFragment, getAllByTestId, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/votes">
				<table>
					<tbody>
						<AddressRow index={0} maxVotes={1} wallet={wallet} />
						<AddressRow index={1} maxVotes={1} wallet={unvotedWallet} />
					</tbody>
				</table>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/votes`],
			},
		);

		await waitFor(() => expect(getAllByTestId("StatusIcon__icon")).toBeTruthy());
		await waitFor(() => expect(getByTestId("AddressRow__select-0")).toBeTruthy());
		await waitFor(() => expect(getByTestId("AddressRow__select-1")).toBeTruthy());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should render with active delegate", async () => {
		const votesMock = jest.spyOn(wallet.voting(), "current").mockReturnValue([
			{
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: data[0].address,
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: false,
					publicKey: data[0].publicKey,
					rank: 1,
					username: data[0].username,
				}),
			},
		]);

		const { container, asFragment, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/votes">
				<table>
					<tbody>
						<AddressRow index={0} maxVotes={1} wallet={wallet} />
					</tbody>
				</table>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/votes`],
			},
		);

		await waitFor(() => expect(getAllByTestId("StatusIcon__icon")).toBeTruthy());

		expect(container).toHaveTextContent("circle-check-mark.svg");

		expect(asFragment()).toMatchSnapshot();

		votesMock.mockRestore();
	});

	it("should render with standby delegate", async () => {
		const votesMock = jest.spyOn(wallet.voting(), "current").mockReturnValue([
			{
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: data[0].address,
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: false,
					publicKey: data[0].publicKey,
					rank: 100,
					username: data[0].username,
				}),
			},
		]);

		const { container, asFragment, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/votes">
				<table>
					<tbody>
						<AddressRow index={0} maxVotes={1} wallet={wallet} />
					</tbody>
				</table>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/votes`],
			},
		);

		await waitFor(() => expect(getAllByTestId("StatusIcon__icon")).toBeTruthy());

		expect(container).toHaveTextContent("clock.svg");

		expect(asFragment()).toMatchSnapshot();

		votesMock.mockRestore();
	});

	it("should render with resigned delegate", async () => {
		const votesMock = jest.spyOn(wallet.voting(), "current").mockReturnValue([
			{
				amount: 0,
				wallet: new ReadOnlyWallet({
					address: data[0].address,
					explorerLink: "",
					governanceIdentifier: "address",
					isDelegate: true,
					isResignedDelegate: true,
					publicKey: data[0].publicKey,
					rank: undefined,
					username: data[0].username,
				}),
			},
		]);

		const { container, asFragment, getAllByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/votes">
				<table>
					<tbody>
						<AddressRow index={0} maxVotes={1} wallet={wallet} />
					</tbody>
				</table>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/votes`],
			},
		);

		await waitFor(() => expect(getAllByTestId("StatusIcon__icon")).toBeTruthy());

		expect(container).toHaveTextContent("circle-cross.svg");

		expect(asFragment()).toMatchSnapshot();

		votesMock.mockRestore();
	});

	it("should emit action on select button", async () => {
		await wallet.synchroniser().identity();
		await wallet.synchroniser().votes();
		await wallet.synchroniser().coin();

		const onSelect = jest.fn();
		const { asFragment, container, getByTestId } = renderWithRouter(
			<Route path="/profiles/:profileId/votes">
				<table>
					<tbody>
						<AddressRow index={0} maxVotes={1} wallet={wallet} onSelect={onSelect} />
					</tbody>
				</table>
			</Route>,
			{
				routes: [`/profiles/${profile.id()}/votes`],
			},
		);
		const selectButton = getByTestId("AddressRow__select-0");

		await waitFor(() => expect(getByTestId("StatusIcon__icon")).toBeTruthy());

		act(() => {
			fireEvent.click(selectButton);
		});

		expect(container).toBeTruthy();
		expect(onSelect).toHaveBeenCalledWith(wallet.address(), wallet.networkId());
		expect(asFragment()).toMatchSnapshot();
	});
});
