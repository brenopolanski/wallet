import { BIP39 } from "@payvo/cryptography";
import { Contracts as ProfilesContracts } from "@payvo/profiles";
import { Contracts } from "@payvo/sdk";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toasts } from "app/services";
import { createMemoryHistory } from "history";
import React from "react";
import { useTranslation } from "react-i18next";
import { Route, Router } from "react-router-dom";
import secondSignatureFixture from "tests/fixtures/coins/ark/devnet/transactions/second-signature-registration.json";
import * as utils from "utils/electron-utils";
import {
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	render,
	renderWithForm,
	screen,
	waitFor,
} from "utils/testing-library";

import { translations as transactionTranslations } from "../../i18n";
import { SecondSignatureRegistrationForm, signSecondSignatureRegistration } from "./SecondSignatureRegistrationForm";

const history = createMemoryHistory();
const dashboardURL = `/profiles/${getDefaultProfileId()}/dashboard`;

describe("SecondSignatureRegistrationForm", () => {
	const passphrase = "power return attend drink piece found tragic fire liar page disease combine";
	let profile: ProfilesContracts.IProfile;
	let wallet: ProfilesContracts.IReadWriteWallet;

	const fees = { avg: 1.354, max: 10, min: 0, static: 0 };

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();
	});

	const createTransactionMock = (wallet: ProfilesContracts.IReadWriteWallet) =>
		// @ts-ignore
		jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
			amount: () => secondSignatureFixture.data.amount / 1e8,
			data: () => ({ data: () => secondSignatureFixture.data }),
			explorerLink: () => `https://dexplorer.ark.io/transaction/${secondSignatureFixture.data.id}`,
			fee: () => secondSignatureFixture.data.fee / 1e8,
			id: () => secondSignatureFixture.data.id,
			recipient: () => secondSignatureFixture.data.recipient,
			sender: () => secondSignatureFixture.data.sender,
		});

	it("should render generation step", async () => {
		history.push(dashboardURL);

		const passphrase = "mock bip39 passphrase";
		const bip39GenerateMock = jest.spyOn(BIP39, "generate").mockReturnValue(passphrase);

		const { form, asFragment } = renderWithForm(
			<Router history={history}>
				<Route path="/profiles/:profileId/dashboard">
					<SecondSignatureRegistrationForm.component profile={profile} activeTab={1} wallet={wallet} />
				</Route>
			</Router>,
			{
				defaultValues: { fees },
				withProviders: true,
			},
		);

		await waitFor(() => expect(screen.getByTestId("SecondSignatureRegistrationForm__generation-step")));
		await waitFor(() => expect(form()?.getValues("secondMnemonic")).toEqual(passphrase));

		expect(bip39GenerateMock).toHaveBeenCalled();
		expect(asFragment()).toMatchSnapshot();

		bip39GenerateMock.mockRestore();
	});

	it("should not generate mnemonic if already set", async () => {
		history.push(dashboardURL);

		const bip39GenerateMock = jest.spyOn(BIP39, "generate").mockImplementation();

		const { form, asFragment } = renderWithForm(
			<Router history={history}>
				<Route path="/profiles/:profileId/dashboard">
					<SecondSignatureRegistrationForm.component profile={profile} activeTab={1} wallet={wallet} />
				</Route>
			</Router>,
			{
				defaultValues: {
					fees,
					secondMnemonic: "test mnemonic",
				},
				withProviders: true,
			},
		);

		await waitFor(() => expect(screen.getByTestId("SecondSignatureRegistrationForm__generation-step")));

		expect(form()?.getValues("secondMnemonic")).toBe("test mnemonic");
		expect(bip39GenerateMock).not.toHaveBeenCalled();
		expect(asFragment()).toMatchSnapshot();

		bip39GenerateMock.mockRestore();
	});

	it("should set fee", async () => {
		renderWithForm(
			<Router history={history}>
				<Route path="/profiles/:profileId/dashboard">
					<SecondSignatureRegistrationForm.component profile={profile} activeTab={1} wallet={wallet} />
				</Route>
			</Router>,
			{
				defaultValues: {
					fees,
				},
				registerCallback: ({ register }) => {
					register("fees");
					register("fee");
					register("inputFeeSettings");
				},
				withProviders: true,
			},
		);

		await waitFor(() => expect(screen.getByTestId("SecondSignatureRegistrationForm__generation-step")));

		// simple

		await waitFor(() => expect(screen.getAllByRole("radio")[1]).toBeChecked());

		userEvent.click(within(screen.getByTestId("InputFee")).getAllByRole("radio")[2]);

		await waitFor(() => expect(screen.getAllByRole("radio")[2]).toBeChecked());

		// advanced

		userEvent.click(screen.getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED));

		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toBeVisible());

		fireEvent.change(screen.getByTestId("InputCurrency"), {
			target: {
				value: "9",
			},
		});

		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("9"));
	});

	describe("backup step", () => {
		it("should render", async () => {
			const { asFragment } = renderWithForm(
				<SecondSignatureRegistrationForm.component profile={profile} activeTab={2} wallet={wallet} />,
				{
					defaultValues: {
						fees,
						secondMnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
					withProviders: true,
				},
			);

			await screen.findByTestId("SecondSignatureRegistrationForm__backup-step");

			const writeTextMock = jest.fn();
			const clipboardOriginal = navigator.clipboard;
			(navigator as any).clipboard = { writeText: writeTextMock };

			fireEvent.click(screen.getByTestId("SecondSignature__copy"));

			await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith("test mnemonic"));

			(navigator as any).clipboard = clipboardOriginal;

			expect(asFragment()).toMatchSnapshot();
		});

		it("should show success toast on successful download", async () => {
			renderWithForm(
				<SecondSignatureRegistrationForm.component profile={profile} activeTab={2} wallet={wallet} />,
				{
					defaultValues: {
						fees,
						secondMnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
					withProviders: true,
				},
			);

			await screen.findByTestId("SecondSignatureRegistrationForm__backup-step");

			jest.spyOn(utils, "saveFile").mockResolvedValueOnce("filePath");

			const toastSpy = jest.spyOn(toasts, "success");

			fireEvent.click(screen.getByTestId("SecondSignature__download"));

			await waitFor(() => expect(toastSpy).toHaveBeenCalled());

			toastSpy.mockRestore();
		});

		it("should not show success toast on cancelled download", async () => {
			renderWithForm(
				<SecondSignatureRegistrationForm.component profile={profile} activeTab={2} wallet={wallet} />,
				{
					defaultValues: {
						fees,
						secondMnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
					withProviders: true,
				},
			);

			await screen.findByTestId("SecondSignatureRegistrationForm__backup-step");

			jest.spyOn(utils, "saveFile").mockResolvedValueOnce(undefined);

			const toastSpy = jest.spyOn(toasts, "success");

			fireEvent.click(screen.getByTestId("SecondSignature__download"));

			await waitFor(() => expect(toastSpy).not.toHaveBeenCalled());

			toastSpy.mockRestore();
		});

		it("should show error toast on error", async () => {
			renderWithForm(
				<SecondSignatureRegistrationForm.component profile={profile} activeTab={2} wallet={wallet} />,
				{
					defaultValues: {
						fees,
						secondMnemonic: "test mnemonic",
						wallet: {
							address: () => "address",
						},
					},
					withProviders: true,
				},
			);

			await screen.findByTestId("SecondSignatureRegistrationForm__backup-step");

			jest.spyOn(utils, "saveFile").mockRejectedValueOnce(new Error("Error"));

			const toastSpy = jest.spyOn(toasts, "error");

			fireEvent.click(screen.getByTestId("SecondSignature__download"));

			await waitFor(() => expect(toastSpy).toHaveBeenCalled());

			toastSpy.mockRestore();
		});
	});

	it("should render verification step", async () => {
		const { form } = renderWithForm(
			<SecondSignatureRegistrationForm.component profile={profile} activeTab={3} wallet={wallet} />,
			{
				defaultValues: {
					fees,
					secondMnemonic: passphrase,
				},
				withProviders: true,
			},
		);

		await screen.findByTestId("SecondSignatureRegistrationForm__verification-step");

		expect(form()?.getValues("verification")).toBeUndefined();

		const walletMnemonic = passphrase.split(" ");

		for (let index = 0; index < 3; index++) {
			const wordNumber = Number.parseInt(screen.getByText(/Select the/).innerHTML.replace(/Select the/, ""));

			fireEvent.click(screen.getByText(walletMnemonic[wordNumber - 1]));

			if (index < 2) {
				await waitFor(() => expect(screen.queryAllByText(/The (\d+)/).length === 2 - index));
			}
		}

		await waitFor(() => expect(form()?.getValues("verification")).toBe(true));
	});

	it("should render review step", async () => {
		renderWithForm(
			<Router history={history}>
				<Route path="/profiles/:profileId/dashboard">
					<SecondSignatureRegistrationForm.component profile={profile} activeTab={4} wallet={wallet} />
				</Route>
			</Router>,
			{
				defaultValues: {
					fee: 0,
					fees,
				},
				withProviders: true,
			},
		);

		await screen.findByTestId("SecondSignatureRegistrationForm__review-step");
	});

	it("should render transaction details", async () => {
		const DetailsComponent = () => {
			const { t } = useTranslation();
			return (
				<SecondSignatureRegistrationForm.transactionDetails
					translations={t}
					transaction={transaction}
					wallet={wallet}
				/>
			);
		};
		const transaction = {
			amount: () => secondSignatureFixture.data.amount / 1e8,
			data: () => ({ data: () => secondSignatureFixture.data }),
			fee: () => secondSignatureFixture.data.fee / 1e8,
			id: () => secondSignatureFixture.data.id,
			recipient: () => secondSignatureFixture.data.recipient,
			sender: () => secondSignatureFixture.data.sender,
		} as Contracts.SignedTransactionData;
		const { asFragment } = render(<DetailsComponent />);

		await screen.findByTestId("TransactionFee");

		expect(asFragment()).toMatchSnapshot();
	});

	it("should sign transaction", async () => {
		const form = {
			clearErrors: jest.fn(),
			getValues: () => ({
				fee: "1",
				mnemonic: MNEMONICS[0],
				network: wallet.network(),
				secondMnemonic: MNEMONICS[1],
				senderAddress: wallet.address(),
			}),
			setError: jest.fn(),
			setValue: jest.fn(),
		};
		const signMock = jest
			.spyOn(wallet.transaction(), "signSecondSignature")
			.mockReturnValue(Promise.resolve(secondSignatureFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [secondSignatureFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await signSecondSignatureRegistration({
			env,
			form,
			profile,
		});

		expect(signMock).toHaveBeenCalled();
		expect(broadcastMock).toHaveBeenCalled();
		expect(transactionMock).toHaveBeenCalled();

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
	});

	it("should sign transaction using encryption password", async () => {
		const walletUsesWIFMock = jest.spyOn(wallet.signingKey(), "exists").mockReturnValue(true);
		const walletWifMock = jest.spyOn(wallet.signingKey(), "get").mockReturnValue(passphrase);

		const form = {
			clearErrors: jest.fn(),
			getValues: () => ({
				encryptionPassword: "password",
				fee: "1",
				network: wallet.network(),
				senderAddress: wallet.address(),
			}),
			setError: jest.fn(),
			setValue: jest.fn(),
		};

		const signMock = jest
			.spyOn(wallet.transaction(), "signSecondSignature")
			.mockReturnValue(Promise.resolve(secondSignatureFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [secondSignatureFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);
		const mutatorMock = jest.spyOn(wallet.mutator(), "removeEncryption").mockImplementation();

		await signSecondSignatureRegistration({
			env,
			form,
			profile,
		});

		expect(signMock).toHaveBeenCalled();
		expect(broadcastMock).toHaveBeenCalled();
		expect(transactionMock).toHaveBeenCalled();
		expect(mutatorMock).toHaveBeenCalledWith("password");

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
		mutatorMock.mockRestore();
		walletUsesWIFMock.mockRestore();
		walletWifMock.mockRestore();
	});
});
