import { Contracts } from "@arkecosystem/platform-sdk-profiles";
import { act, renderHook } from "@testing-library/react-hooks";
import { Form } from "app/components/Form";
import React from "react";
import { useForm } from "react-hook-form";
import {
	env,
	fireEvent,
	getDefaultProfileId,
	getDefaultWalletId,
	renderWithRouter,
	screen,
	waitFor,
} from "utils/testing-library";

import { AuthenticationStep } from "./AuthenticationStep";

describe("AuthenticationStep", () => {
	let wallet: Contracts.IReadWriteWallet;
	let profile: Contracts.IProfile;

	beforeEach(() => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().first();
	});

	const Component = ({ form }: any) => (
		<Form context={form} onSubmit={() => void 0}>
			<AuthenticationStep wallet={wallet} />
		</Form>
	);

	it("should validate if mnemonic match the wallet address", async () => {
		wallet = await profile.walletFactory().fromMnemonic({
			mnemonic: "passphrase",
			coin: "ARK",
			network: "ark.devnet",
		});

		profile.wallets().push(wallet);

		jest.spyOn(wallet, "isSecondSignature").mockReturnValue(false);

		const TestValidation = () => {
			const form = useForm({ mode: "onChange" });
			const { formState } = form;
			const { isValid } = formState;

			return (
				<div>
					<span>{isValid ? "Valid" : "Invalid"}</span>
					<Component form={form} />
				</div>
			);
		};

		renderWithRouter(<TestValidation />);

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: "wrong passphrase",
				},
			});
		});

		await waitFor(() => expect(screen.queryByText("Invalid")).toBeInTheDocument());

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: "passphrase",
				},
			});
		});

		await waitFor(() => expect(screen.queryByText("Valid")).toBeInTheDocument());

		profile.wallets().forget(wallet.id());
		jest.clearAllMocks();
	});

	it("should validate if second mnemonic match the wallet second public key", async () => {
		wallet = await profile.walletFactory().fromMnemonic({
			mnemonic: "passphrase",
			coin: "ARK",
			network: "ark.devnet",
		});

		profile.wallets().push(wallet);
		const secondMnemonic = "my second mnemonic";

		jest.spyOn(wallet, "isSecondSignature").mockReturnValue(true);
		jest.spyOn(wallet, "secondPublicKey").mockReturnValue(
			await wallet.coin().identity().publicKey().fromMnemonic(secondMnemonic),
		);

		const TestValidation = () => {
			const form = useForm({ mode: "onChange" });
			const { formState } = form;
			const { isValid } = formState;

			return (
				<div>
					<span>{isValid ? "Valid" : "Invalid"}</span>
					<Component form={form} />
				</div>
			);
		};

		renderWithRouter(<TestValidation />);

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: "passphrase",
				},
			});
		});

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__second-mnemonic"), {
				target: {
					value: "wrong second mnemonic",
				},
			});
		});

		await waitFor(() => expect(screen.queryByText("Invalid")).toBeInTheDocument());

		act(() => {
			fireEvent.input(screen.getByTestId("AuthenticationStep__second-mnemonic"), {
				target: {
					value: secondMnemonic,
				},
			});
		});

		await waitFor(() => expect(screen.queryByText("Valid")).toBeInTheDocument());

		profile.wallets().forget(wallet.id());
		jest.clearAllMocks();
	});

	it("should request mnemonic", async () => {
		jest.spyOn(wallet, "isSecondSignature").mockReturnValueOnce(false);

		const { result } = renderHook(() => useForm({ mode: "onChange", shouldUnregister: false }));
		const { asFragment } = renderWithRouter(<Component form={result.current} />);

		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeNull());
		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__mnemonic")).toBeInTheDocument());

		act(() => {
			fireEvent.change(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: "my mnemonic",
				},
			});
		});

		await waitFor(() => expect(result.current.getValues()).toEqual({ mnemonic: "my mnemonic" }));
		expect(asFragment()).toMatchSnapshot();
	});

	it("should request mnemonic and second mnemonic", async () => {
		await wallet.synchroniser().identity();
		jest.spyOn(wallet, "isSecondSignature").mockReturnValueOnce(true);

		const { result } = renderHook(() => useForm({ mode: "onChange", shouldUnregister: false }));
		const { asFragment } = renderWithRouter(<Component form={result.current} />);

		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__mnemonic")).toBeInTheDocument());
		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeInTheDocument());

		act(() => {
			fireEvent.change(screen.getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: "my mnemonic",
				},
			});
		});

		act(() => {
			fireEvent.change(screen.getByTestId("AuthenticationStep__second-mnemonic"), {
				target: {
					value: "my second mnemonic",
				},
			});
		});

		await waitFor(() =>
			expect(result.current.getValues()).toEqual({
				mnemonic: "my mnemonic",
				secondMnemonic: "my second mnemonic",
			}),
		);
		expect(asFragment()).toMatchSnapshot();
	});

	it("should show only ledger confirmation", async () => {
		jest.spyOn(wallet, "isLedger").mockReturnValueOnce(true);

		const { result } = renderHook(() => useForm({ mode: "onChange", shouldUnregister: false }));
		const { asFragment } = renderWithRouter(<Component form={result.current} />);

		await waitFor(() => expect(screen.queryByTestId("LedgerConfirmation-description")).toBeInTheDocument());
		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__mnemonic")).toBeNull());
		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).toBeNull());

		expect(asFragment()).toMatchSnapshot();
	});

	it("should skip second signature", async () => {
		jest.spyOn(wallet, "isSecondSignature").mockReturnValueOnce(true);

		const { result } = renderHook(() => useForm({ mode: "onChange", shouldUnregister: false }));
		const { asFragment } = renderWithRouter(
			<Form context={result.current} onSubmit={() => void 0}>
				<AuthenticationStep wallet={wallet} skipSecondSignature />
			</Form>,
		);

		await waitFor(() => expect(screen.queryByTestId("AuthenticationStep__mnemonic")).toBeInTheDocument());
		await waitFor(() =>
			expect(screen.queryByTestId("AuthenticationStep__second-mnemonic")).not.toBeInTheDocument(),
		);
	});

	it("should show ledger waiting device screen", () => {
		jest.spyOn(wallet, "isLedger").mockReturnValueOnce(true);

		const { result } = renderHook(() => useForm({ mode: "onChange", shouldUnregister: false }));
		const { container, queryByTestId } = renderWithRouter(
			<Form context={result.current} onSubmit={() => void 0}>
				<AuthenticationStep wallet={wallet} ledgerIsAwaitingDevice={true} />
			</Form>,
		);

		expect(queryByTestId("LedgerWaitingDevice-loading_message")).toBeInTheDocument();

		expect(container).toMatchSnapshot();
	});

	it("should show ledger waiting app screen", () => {
		jest.spyOn(wallet, "isLedger").mockReturnValueOnce(true);

		const { result } = renderHook(() => useForm({ mode: "onChange", shouldUnregister: false }));
		const { container, queryByTestId } = renderWithRouter(
			<Form context={result.current} onSubmit={() => void 0}>
				<AuthenticationStep wallet={wallet} ledgerIsAwaitingDevice={false} ledgerIsAwaitingApp={true} />
			</Form>,
		);

		expect(queryByTestId("LedgerWaitingApp-loading_message")).toBeInTheDocument();

		expect(container).toMatchSnapshot();
	});

	it("should render with encryption password input", async () => {
		jest.spyOn(wallet.wif(), "exists").mockReturnValue(true);

		const { result } = renderHook(() => useForm({ mode: "onChange" }));
		const { getByTestId } = renderWithRouter(
			<Form context={result.current} onSubmit={() => void 0}>
				<AuthenticationStep wallet={wallet} />
			</Form>,
		);

		await waitFor(() => expect(getByTestId("AuthenticationStep__encryption-password")).toBeInTheDocument());

		jest.clearAllMocks();
	});

	it("should render with encryption password input and second mnemonic", async () => {
		wallet = profile.wallets().findById(getDefaultWalletId());

		jest.spyOn(wallet.wif(), "exists").mockReturnValue(true);
		jest.spyOn(wallet.wif(), "get").mockImplementation(() => {
			const wif = "S9rDfiJ2ar4DpWAQuaXECPTJHfTZ3XjCPv15gjxu4cHJZKzABPyV";
			return Promise.resolve(wif);
		});
		jest.spyOn(wallet, "isSecondSignature").mockReturnValue(true);

		const { result } = renderHook(() => useForm({ mode: "onChange" }));

		const Wrapper = () => (
			<Form context={result.current} onSubmit={() => void 0}>
				<AuthenticationStep wallet={wallet} />
			</Form>
		);

		const { rerender } = renderWithRouter(<Wrapper />);

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__encryption-password")).toBeInTheDocument());
		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__second-mnemonic")).toBeDisabled());

		fireEvent.input(screen.getByTestId("AuthenticationStep__encryption-password"), {
			target: { value: "password" },
		});

		rerender(<Wrapper />);

		await waitFor(() => expect(screen.getByTestId("AuthenticationStep__second-mnemonic")).toBeEnabled());

		jest.clearAllMocks();
	});
});
