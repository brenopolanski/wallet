/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk";
import { Contracts as ProfilesContracts } from "@payvo/sdk-profiles";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as useFeesHook from "app/hooks/use-fees";
import { translations } from "domains/transaction/i18n";
import React, { useEffect } from "react";
import { FormProvider, useForm, UseFormMethods } from "react-hook-form";
import { Route } from "react-router-dom";
import delegateRegistrationFixture from "tests/fixtures/coins/ark/devnet/transactions/delegate-registration.json";
import {
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	render,
	RenderResult,
	syncDelegates,
	waitFor,
} from "utils/testing-library";

import { DelegateRegistrationForm, signDelegateRegistration } from "./DelegateRegistrationForm";

let profile: ProfilesContracts.IProfile;
let wallet: ProfilesContracts.IReadWriteWallet;

const fees = { avg: 1.354, isDynamic: true, max: 10, min: 0, static: 0 };

const renderComponent = (properties?: any) => {
	let form: UseFormMethods | undefined;

	const defaultValues = properties?.defaultValues ?? { fee: "2" };
	const activeTab = properties?.activeTab ?? 1;

	const Component = () => {
		form = useForm<any>({ defaultValues, mode: "onChange" });

		const { register } = form;

		useEffect(() => {
			register("fee");
			register("fees");
			register("inputFeeSettings");
		}, [register]);

		return (
			<FormProvider {...form}>
				<DelegateRegistrationForm.component profile={profile} activeTab={activeTab} wallet={wallet} />
			</FormProvider>
		);
	};

	const utils: RenderResult = render(
		<Route path="/profiles/:profileId">
			<Component />
		</Route>,
		{
			routes: [`/profiles/${profile.id()}`],
		},
	);

	return { ...utils, form };
};

const createTransactionMock = (wallet: ProfilesContracts.IReadWriteWallet) =>
	// @ts-ignore
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue({
		amount: () => +delegateRegistrationFixture.data.amount / 1e8,
		data: () => ({ data: () => delegateRegistrationFixture.data }),
		explorerLink: () => `https://dexplorer.ark.io/transaction/${delegateRegistrationFixture.data.id}`,
		fee: () => +delegateRegistrationFixture.data.fee / 1e8,
		id: () => delegateRegistrationFixture.data.id,
		recipient: () => delegateRegistrationFixture.data.recipient,
		sender: () => delegateRegistrationFixture.data.sender,
		username: () => delegateRegistrationFixture.data.asset.delegate.username,
	});

describe("DelegateRegistrationForm", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		wallet = profile.wallets().first();

		await syncDelegates(profile);

		jest.spyOn(useFeesHook, "useFees").mockReturnValue({
			calculate: () => Promise.resolve(fees),
		});
	});

	it("should render form step", async () => {
		const { asFragment } = renderComponent();

		await waitFor(() => expect(asFragment()).toMatchSnapshot());
	});

	it("should render review step", async () => {
		const { asFragment } = renderComponent({ activeTab: 2 });

		await screen.findByTestId("DelegateRegistrationForm__review-step");
		await waitFor(() => expect(asFragment()).toMatchSnapshot());
	});

	it("should set username", async () => {
		const { form } = renderComponent();

		await screen.findByTestId("DelegateRegistrationForm__form-step");

		fireEvent.change(screen.getByTestId("Input__username"), { target: { value: "test_delegate" } });

		await waitFor(() => expect(screen.getByTestId("Input__username")).toHaveValue("test_delegate"));
		await waitFor(() => expect(form?.getValues("username")).toBe("test_delegate"));
	});

	it("should set fee", async () => {
		const { asFragment } = renderComponent({
			defaultValues: {
				fee: "10",
			},
		});

		await screen.findByTestId("DelegateRegistrationForm__form-step");
		await screen.findByTestId("InputFee");

		userEvent.click(screen.getByText(translations.INPUT_FEE_VIEW_TYPE.ADVANCED));

		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("10"));

		fireEvent.change(screen.getByTestId("InputCurrency"), {
			target: {
				value: "11",
			},
		});

		await waitFor(() => expect(screen.getByTestId("InputCurrency")).toHaveValue("11"));
		await waitFor(() => expect(asFragment()).toMatchSnapshot());
	});

	it("should show error if username contains illegal characters", async () => {
		const { asFragment } = renderComponent();

		await waitFor(() => expect(screen.getByTestId("DelegateRegistrationForm__form-step")));

		fireEvent.change(screen.getByTestId("Input__username"), { target: { value: "<invalid>" } });

		await waitFor(() => expect(screen.getByTestId("Input__username")).toHaveAttribute("aria-invalid"));

		expect(screen.getByTestId("Input__error")).toBeVisible();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should error if username is too long", async () => {
		const { asFragment } = renderComponent();

		await waitFor(() => expect(screen.getByTestId("DelegateRegistrationForm__form-step")));

		fireEvent.change(screen.getByTestId("Input__username"), {
			target: { value: "thisisaveryveryverylongdelegatename" },
		});

		await waitFor(() => expect(screen.getByTestId("Input__username")).toHaveAttribute("aria-invalid"));

		expect(screen.getByTestId("Input__error")).toBeVisible();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show error if username already exists", async () => {
		const { asFragment } = renderComponent();

		await waitFor(() => expect(screen.getByTestId("DelegateRegistrationForm__form-step")));

		fireEvent.change(screen.getByTestId("Input__username"), { target: { value: "arkx" } });

		await waitFor(() => expect(screen.getByTestId("Input__username")).toHaveAttribute("aria-invalid"));

		expect(screen.getByTestId("Input__error")).toBeVisible();
		expect(asFragment()).toMatchSnapshot();
	});

	it("should sign transaction", async () => {
		const form = {
			clearErrors: jest.fn(),
			getValues: () => ({
				fee: "1",
				mnemonic: MNEMONICS[0],
				network: wallet.network(),
				senderAddress: wallet.address(),
				username: "test_delegate",
			}),
			setError: jest.fn(),
			setValue: jest.fn(),
		};
		const signMock = jest
			.spyOn(wallet.transaction(), "signDelegateRegistration")
			.mockReturnValue(Promise.resolve(delegateRegistrationFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [delegateRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await signDelegateRegistration({
			env,
			form,
			profile,
		});

		expect(signMock).toHaveBeenCalledWith({ data: { username: "test_delegate" }, fee: 1 });
		expect(broadcastMock).toHaveBeenCalledWith(delegateRegistrationFixture.data.id);
		expect(transactionMock).toHaveBeenCalledWith(delegateRegistrationFixture.data.id);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
	});

	it("should output transaction details", () => {
		const translations = jest.fn((translation) => translation);
		const transaction = {
			amount: () => delegateRegistrationFixture.data.amount / 1e8,
			data: () => ({ data: () => delegateRegistrationFixture.data }),
			fee: () => delegateRegistrationFixture.data.fee / 1e8,
			id: () => delegateRegistrationFixture.data.id,
			recipient: () => delegateRegistrationFixture.data.recipient,
			sender: () => delegateRegistrationFixture.data.sender,
			username: () => delegateRegistrationFixture.data.asset.delegate.username,
		} as Contracts.SignedTransactionData;

		const { getByText } = render(
			<DelegateRegistrationForm.transactionDetails
				transaction={transaction}
				translations={translations}
				wallet={wallet}
			/>,
		);

		expect(getByText("TRANSACTION.DELEGATE_NAME")).toBeInTheDocument();
		expect(getByText("test_delegate")).toBeInTheDocument();
	});

	it("should sign transaction using password encryption", async () => {
		const walletUsesWIFMock = jest.spyOn(wallet.signingKey(), "exists").mockReturnValue(true);
		const walletWifMock = jest.spyOn(wallet.signingKey(), "get").mockReturnValue(MNEMONICS[0]);

		const form = {
			clearErrors: jest.fn(),
			getValues: () => ({
				encryptionPassword: "password",
				fee: "1",
				mnemonic: MNEMONICS[0],
				network: wallet.network(),
				senderAddress: wallet.address(),
				username: "test_delegate",
			}),
			setError: jest.fn(),
			setValue: jest.fn(),
		};
		const signMock = jest
			.spyOn(wallet.transaction(), "signDelegateRegistration")
			.mockReturnValue(Promise.resolve(delegateRegistrationFixture.data.id));
		const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
			accepted: [delegateRegistrationFixture.data.id],
			errors: {},
			rejected: [],
		});
		const transactionMock = createTransactionMock(wallet);

		await signDelegateRegistration({
			env,
			form,
			profile,
		});

		expect(signMock).toHaveBeenCalledWith({ data: { username: "test_delegate" }, fee: 1 });
		expect(broadcastMock).toHaveBeenCalledWith(delegateRegistrationFixture.data.id);
		expect(transactionMock).toHaveBeenCalledWith(delegateRegistrationFixture.data.id);

		signMock.mockRestore();
		broadcastMock.mockRestore();
		transactionMock.mockRestore();
		walletUsesWIFMock.mockRestore();
		walletWifMock.mockRestore();
	});
});
