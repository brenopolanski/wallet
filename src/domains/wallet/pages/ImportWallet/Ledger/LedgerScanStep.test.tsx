import Transport from "@ledgerhq/hw-transport";
import { Contracts } from "@payvo/sdk-profiles";
import userEvent from "@testing-library/user-event";
import { LedgerProvider } from "app/contexts/Ledger/Ledger";
import nock from "nock";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
	env,
	fireEvent,
	getDefaultLedgerTransport,
	getDefaultProfileId,
	render,
	screen,
	waitFor,
} from "utils/testing-library";

import { LedgerScanStep } from "./LedgerScanStep";

describe("LedgerScanStep", () => {
	let profile: Contracts.IProfile;
	let wallet: Contracts.IReadWriteWallet;
	let transport: typeof Transport;
	let publicKeyPaths: Map<string, string>;

	beforeAll(() => {
		publicKeyPaths = new Map<string, string>();

		nock("https://ark-test.payvo.com/api")
			.get("/wallets")
			.query((parameters) => !!parameters.address)
			.reply(200, {
				data: [
					{
						address: "DJpFwW39QnQvQRQJF2MCfAoKvsX4DJ28jq",
						balance: "2",
					},
					{
						address: "DSyG9hK9CE8eyfddUoEvsga4kNVQLdw2ve",
						balance: "3",
					},
				],
				meta: {},
			})
			.get("/wallets")
			.query((parameters) => !!parameters.address)
			.reply(200, {
				data: [],
				meta: {},
			})
			.get("/wallets")
			.query((parameters) => !!parameters.address)
			.reply(200, {
				data: [],
				meta: {},
			});
	});

	beforeEach(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().first();
		await wallet.synchroniser().identity();

		transport = getDefaultLedgerTransport();
		jest.spyOn(transport, "listen").mockImplementationOnce(() => ({ unsubscribe: jest.fn() }));

		publicKeyPaths = new Map([
			["m/44'/1'/0'/0/0", "027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582"],
			["m/44'/1'/0'/0/1", "03d3fdad9c5b25bf8880e6b519eb3611a5c0b31adebc8455f0e096175b28321aff"],
			["m/44'/1'/0'/0/2", "025f81956d5826bad7d30daed2b5c8c98e72046c1ec8323da336445476183fb7ca"],
			["m/44'/1'/0'/0/3", "024d5eacc5e05e1b05c476b367b7d072857826d9b271e07d3a3327224db8892a21"],
			["m/44'/1'/0'/0/4", "025d7298a7a472b1435e40df13491e98609b9b555bf3ef452b2afea27061d11235"],

			["m/44'/1'/0'/0/0", "027716e659220085e41389efc7cf6a05f7f7c659cf3db9126caabce6cda9156582"],
			["m/44'/1'/1'/0/0", wallet.publicKey()!],
			["m/44'/1'/2'/0/0", "020aac4ec02d47d306b394b79d3351c56c1253cd67fe2c1a38ceba59b896d584d1"],
			["m/44'/1'/3'/0/0", "033a5474f68f92f254691e93c06a2f22efaf7d66b543a53efcece021819653a200"],
			["m/44'/1'/4'/0/0", "03d3c6889608074b44155ad2e6577c3368e27e6e129c457418eb3e5ed029544e8d"],
		]);

		jest.spyOn(wallet.coin().ledger(), "getPublicKey").mockImplementation((path) =>
			Promise.resolve(publicKeyPaths.get(path)!),
		);

		jest.spyOn(wallet.coin().ledger(), "getExtendedPublicKey").mockResolvedValue(wallet.publicKey()!);
	});

	it("should handle select", async () => {
		let formReference: ReturnType<typeof useForm>;

		const Component = () => {
			const form = useForm({
				defaultValues: {
					network: wallet.network(),
				},
			});
			formReference = form;

			return (
				<FormProvider {...form}>
					<LedgerProvider transport={transport}>
						<LedgerScanStep profile={profile} />
					</LedgerProvider>
				</FormProvider>
			);
		};

		render(<Component />);

		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(6));

		fireEvent.click(screen.getByTestId("LedgerScanStep__select-all"));

		await waitFor(() => expect(screen.getAllByRole("checkbox", { checked: true })).toHaveLength(2));

		// Unselect All

		fireEvent.click(screen.getByTestId("LedgerScanStep__select-all"));

		await waitFor(() => expect(screen.getAllByRole("checkbox", { checked: false })).toHaveLength(2));

		// Select just first

		fireEvent.click(screen.getAllByRole("checkbox")[1]);

		await waitFor(() => expect(formReference.getValues("wallets")).toHaveLength(1));

		fireEvent.click(screen.getAllByRole("checkbox")[1]);

		await waitFor(() => expect(formReference.getValues("wallets")).toHaveLength(0));
	});

	it("should render", async () => {
		let formReference: ReturnType<typeof useForm>;
		const Component = () => {
			const form = useForm({
				defaultValues: {
					network: wallet.network(),
				},
			});
			formReference = form;

			return (
				<FormProvider {...form}>
					<LedgerProvider transport={transport}>
						<LedgerScanStep profile={profile} />
					</LedgerProvider>
				</FormProvider>
			);
		};

		const { container } = render(<Component />);

		await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(6));
		await screen.findByText("DQseW3VJ1db5xN5xZi4Qhn6AFWtcwSwzpG");

		await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(2));

		await waitFor(() =>
			expect(formReference.getValues("wallets")).toMatchObject([
				{
					address: "DQseW3VJ1db5xN5xZi4Qhn6AFWtcwSwzpG",
					balance: 0,
					path: "m/44'/1'/0'/0/0",
				},
			]),
		);

		const checkboxSelectAll = screen.getAllByRole("checkbox")[0];
		const checkboxFirstItem = screen.getAllByRole("checkbox")[1];

		userEvent.click(checkboxSelectAll);

		await waitFor(() => expect(formReference.getValues("wallets")).toMatchObject([]));

		userEvent.click(checkboxSelectAll);

		await waitFor(() =>
			expect(formReference.getValues("wallets")).toMatchObject([
				{ address: "DQseW3VJ1db5xN5xZi4Qhn6AFWtcwSwzpG" },
			]),
		);

		userEvent.click(checkboxFirstItem);

		await waitFor(() => expect(formReference.getValues("wallets")).toMatchObject([]));

		userEvent.click(checkboxFirstItem);

		await waitFor(() =>
			expect(formReference.getValues("wallets")).toMatchObject([
				{ address: "DQseW3VJ1db5xN5xZi4Qhn6AFWtcwSwzpG" },
			]),
		);

		expect(container).toMatchSnapshot();
	});
});
