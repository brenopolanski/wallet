import { Contracts } from "@payvo/sdk-profiles";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { translations as transactionTranslations } from "domains/transaction/i18n";
import { createMemoryHistory } from "history";
import React from "react";
import { Route } from "react-router-dom";
import transactionFixture from "tests/fixtures/coins/ark/devnet/transactions/transfer.json";
import {
	env,
	fireEvent,
	getDefaultProfileId,
	MNEMONICS,
	render,
	syncDelegates,
	syncFees,
	waitFor,
} from "utils/testing-library";

import { SendDelegateResignation } from "./SendDelegateResignation";

let wallet: Contracts.IReadWriteWallet;
let profile: Contracts.IProfile;

let resignationUrl: string;

const passphrase = MNEMONICS[0];
const history = createMemoryHistory();

const renderPage = () => {
	const path = "/profiles/:profileId/wallets/:walletId/send-delegate-resignation";

	return render(
		<Route path={path}>
			<SendDelegateResignation />
		</Route>,
		{
			history,
			routes: [resignationUrl],
		},
	);
};

const transactionResponse = {
	amount: () => +transactionFixture.data.amount / 1e8,
	data: () => ({ data: () => transactionFixture.data }),
	explorerLink: () => `https://dexplorer.ark.io/transaction/${transactionFixture.data.id}`,
	fee: () => +transactionFixture.data.fee / 1e8,
	id: () => transactionFixture.data.id,
	isMultiSignatureRegistration: () => false,
	recipient: () => transactionFixture.data.recipient,
	sender: () => transactionFixture.data.sender,
	type: () => "delegateResignation",
	usesMultiSignature: () => false,
};

const createTransactionMock = (wallet: Contracts.IReadWriteWallet) =>
	jest.spyOn(wallet.transaction(), "transaction").mockReturnValue(transactionResponse as any);

describe("SendDelegateResignation", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());

		await env.profiles().restore(profile);
		await profile.sync();

		// wallet = profile.wallets().findById("d044a552-7a49-411c-ae16-8ff407acc430");
		wallet = profile.wallets().push(
			await profile.walletFactory().fromMnemonicWithBIP39({
				coin: "ARK",
				mnemonic: passphrase,
				network: "ark.devnet",
			}),
		);
		await wallet.synchroniser().identity();

		await syncDelegates(profile);
		await syncFees(profile);
	});

	describe("Delegate Resignation", () => {
		beforeEach(() => {
			resignationUrl = `/profiles/${getDefaultProfileId()}/wallets/${wallet.id()}/send-delegate-resignation`;
			history.push(resignationUrl);
		});

		it("should render 1st step", async () => {
			const { asFragment, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			expect(asFragment()).toMatchSnapshot();
		});

		it("should change fee", async () => {
			const { asFragment, getByTestId, getByText, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			// Fee (simple)
			expect(screen.getAllByRole("radio")[1]).toBeChecked();

			userEvent.click(within(screen.getByTestId("InputFee")).getAllByRole("radio")[2]);
			await waitFor(() => expect(screen.getAllByRole("radio")[2]).toBeChecked());

			// Fee (advanced)
			userEvent.click(getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED));
			fireEvent.input(getByTestId("InputCurrency"), { target: { value: "1" } });
			await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("1"));

			expect(asFragment()).toMatchSnapshot();
		});

		it("should render 2nd step", async () => {
			const { asFragment, getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			expect(asFragment()).toMatchSnapshot();
		});

		it("should go back to wallet details", async () => {
			const historySpy = jest.spyOn(history, "push").mockImplementation();

			const { getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.click(getByTestId("StepNavigation__back-button"));

			expect(historySpy).toHaveBeenCalledWith(`/profiles/${profile.id()}/wallets/${wallet.id()}`);

			historySpy.mockRestore();
		});

		it("should navigate between 1st and 2nd step", async () => {
			const { getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.click(getByTestId("StepNavigation__back-button"));
			await findByTestId("SendDelegateResignation__form-step");
		});

		it("should render 3rd step", async () => {
			const { asFragment, getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("AuthenticationStep");

			expect(asFragment()).toMatchSnapshot();
		});

		it("should return to form step by cancelling fee warning", async () => {
			const { getByText, getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			// Fee
			userEvent.click(getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED));
			fireEvent.change(getByTestId("InputCurrency"), { target: { value: "30" } });
			await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("30"));

			await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("FeeWarning__cancel-button");

			userEvent.click(getByTestId("FeeWarning__cancel-button"));
			await findByTestId("SendDelegateResignation__form-step");
		});

		it("should proceed to authentication step by confirming fee warning", async () => {
			const { getByText, getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			// Fee
			userEvent.click(getByText(transactionTranslations.INPUT_FEE_VIEW_TYPE.ADVANCED));
			fireEvent.change(getByTestId("InputCurrency"), { target: { value: "30" } });
			await waitFor(() => expect(getByTestId("InputCurrency")).toHaveValue("30"));

			await waitFor(() => expect(getByTestId("StepNavigation__continue-button")).not.toBeDisabled());

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("FeeWarning__continue-button");

			userEvent.click(getByTestId("FeeWarning__continue-button"));
			await findByTestId("AuthenticationStep");
		});

		it("should show mnemonic authentication error", async () => {
			const secondPublicKeyMock = jest
				.spyOn(wallet, "secondPublicKey")
				.mockReturnValue((await wallet.coin().publicKey().fromMnemonic(MNEMONICS[1])).publicKey);

			const { asFragment, getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("AuthenticationStep");

			fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

			fireEvent.input(getByTestId("AuthenticationStep__second-mnemonic"), {
				target: {
					value: MNEMONICS[2],
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__second-mnemonic")).toHaveValue(MNEMONICS[2]));

			expect(getByTestId("AuthenticationStep__second-mnemonic")).toHaveAttribute("aria-invalid");
			expect(getByTestId("StepNavigation__send-button")).toBeDisabled();

			expect(asFragment()).toMatchSnapshot();

			secondPublicKeyMock.mockRestore();
		});

		it("should show error step and go back", async () => {
			const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockImplementation(() => {
				throw new Error("broadcast error");
			});

			const secondPublicKeyMock = jest
				.spyOn(wallet, "secondPublicKey")
				.mockReturnValue((await wallet.coin().publicKey().fromMnemonic(MNEMONICS[1])).publicKey);

			const { asFragment, getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("AuthenticationStep");

			fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

			fireEvent.input(getByTestId("AuthenticationStep__second-mnemonic"), {
				target: {
					value: MNEMONICS[1],
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__second-mnemonic")).toHaveValue(MNEMONICS[1]));

			userEvent.click(getByTestId("StepNavigation__send-button"));

			await findByTestId("ErrorStep");

			expect(getByTestId("ErrorStep__errorMessage")).toHaveTextContent("broadcast error");
			expect(asFragment()).toMatchSnapshot();

			const historyMock = jest.spyOn(history, "push").mockReturnValue();

			userEvent.click(getByTestId("ErrorStep__wallet-button"));

			const walletDetailPage = `/profiles/${getDefaultProfileId()}/wallets/${wallet.id()}`;
			await waitFor(() => expect(historyMock).toHaveBeenCalledWith(walletDetailPage));

			historyMock.mockRestore();

			secondPublicKeyMock.mockRestore();
			broadcastMock.mockRestore();
		});

		it("should successfully sign and submit resignation transaction", async () => {
			const secondPublicKeyMock = jest
				.spyOn(wallet, "secondPublicKey")
				.mockReturnValue((await wallet.coin().publicKey().fromMnemonic(MNEMONICS[1])).publicKey);
			const signMock = jest
				.spyOn(wallet.transaction(), "signDelegateResignation")
				.mockReturnValue(Promise.resolve(transactionFixture.data.id));
			const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
				accepted: [transactionFixture.data.id],
				errors: {},
				rejected: [],
			});
			const transactionMock = createTransactionMock(wallet);

			const { asFragment, getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("AuthenticationStep");

			fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

			fireEvent.input(getByTestId("AuthenticationStep__second-mnemonic"), {
				target: {
					value: MNEMONICS[1],
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__second-mnemonic")).toHaveValue(MNEMONICS[1]));

			userEvent.click(getByTestId("StepNavigation__send-button"));
			await findByTestId("TransactionSuccessful");

			expect(asFragment()).toMatchSnapshot();

			secondPublicKeyMock.mockRestore();
			signMock.mockRestore();
			broadcastMock.mockRestore();
			transactionMock.mockRestore();
		});

		it("should successfully sign and submit resignation transaction with keyboard", async () => {
			const secondPublicKeyMock = jest
				.spyOn(wallet, "secondPublicKey")
				.mockReturnValue((await wallet.coin().publicKey().fromMnemonic(MNEMONICS[1])).publicKey);
			const signMock = jest
				.spyOn(wallet.transaction(), "signDelegateResignation")
				.mockReturnValue(Promise.resolve(transactionFixture.data.id));
			const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
				accepted: [transactionFixture.data.id],
				errors: {},
				rejected: [],
			});
			const transactionMock = createTransactionMock(wallet);

			const { asFragment, getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.keyboard("{enter}");
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.keyboard("{enter}");
			await findByTestId("AuthenticationStep");

			fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

			fireEvent.input(getByTestId("AuthenticationStep__second-mnemonic"), {
				target: {
					value: MNEMONICS[1],
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__second-mnemonic")).toHaveValue(MNEMONICS[1]));

			userEvent.keyboard("{enter}");
			userEvent.click(getByTestId("StepNavigation__send-button"));
			await findByTestId("TransactionSuccessful");

			expect(asFragment()).toMatchSnapshot();

			secondPublicKeyMock.mockRestore();
			signMock.mockRestore();
			broadcastMock.mockRestore();
			transactionMock.mockRestore();
		});

		it("should back button after successful submission", async () => {
			const secondPublicKeyMock = jest
				.spyOn(wallet, "secondPublicKey")
				.mockReturnValue((await wallet.coin().publicKey().fromMnemonic(MNEMONICS[1])).publicKey);
			const signMock = jest
				.spyOn(wallet.transaction(), "signDelegateResignation")
				.mockReturnValue(Promise.resolve(transactionFixture.data.id));
			const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
				accepted: [transactionFixture.data.id],
				errors: {},
				rejected: [],
			});
			const transactionMock = createTransactionMock(wallet);

			const { getByTestId, findByTestId } = renderPage();

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("AuthenticationStep");

			fireEvent.input(getByTestId("AuthenticationStep__mnemonic"), {
				target: {
					value: passphrase,
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__mnemonic")).toHaveValue(passphrase));

			fireEvent.input(getByTestId("AuthenticationStep__second-mnemonic"), {
				target: {
					value: MNEMONICS[1],
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__second-mnemonic")).toHaveValue(MNEMONICS[1]));

			userEvent.click(getByTestId("StepNavigation__send-button"));
			await findByTestId("TransactionSuccessful");

			const historyMock = jest.spyOn(history, "push").mockReturnValue();

			userEvent.click(getByTestId("StepNavigation__back-to-wallet-button"));

			const walletDetailPage = `/profiles/${getDefaultProfileId()}/wallets/${wallet.id()}`;
			await waitFor(() => expect(historyMock).toHaveBeenCalledWith(walletDetailPage));

			historyMock.mockRestore();

			secondPublicKeyMock.mockRestore();
			signMock.mockRestore();
			broadcastMock.mockRestore();
			transactionMock.mockRestore();
		});

		it("should successfully sign and submit resignation transaction using encryption password", async () => {
			const actsWithMnemonicMock = jest.spyOn(wallet, "actsWithMnemonic").mockReturnValue(false);
			const actsWithWifWithEncryptionMock = jest.spyOn(wallet, "actsWithWifWithEncryption").mockReturnValue(true);
			const wifGetMock = jest.spyOn(wallet.signingKey(), "get").mockReturnValue(passphrase);

			const secondPublicKeyMock = jest.spyOn(wallet, "isSecondSignature").mockReturnValue(false);
			const signMock = jest
				.spyOn(wallet.transaction(), "signDelegateResignation")
				.mockReturnValue(Promise.resolve(transactionFixture.data.id));
			const broadcastMock = jest.spyOn(wallet.transaction(), "broadcast").mockResolvedValue({
				accepted: [transactionFixture.data.id],
				errors: {},
				rejected: [],
			});
			const transactionMock = createTransactionMock(wallet);

			const resignationEncryptedUrl = `/profiles/${getDefaultProfileId()}/wallets/${wallet.id()}/send-delegate-resignation`;
			history.push(resignationEncryptedUrl);

			const { asFragment, getByTestId, findByTestId } = render(
				<Route path="/profiles/:profileId/wallets/:walletId/send-delegate-resignation">
					<SendDelegateResignation />
				</Route>,
				{
					history,
					routes: [resignationEncryptedUrl],
				},
			);

			await findByTestId("SendDelegateResignation__form-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("SendDelegateResignation__review-step");

			userEvent.click(getByTestId("StepNavigation__continue-button"));
			await findByTestId("AuthenticationStep");

			fireEvent.input(getByTestId("AuthenticationStep__encryption-password"), {
				target: {
					value: "password",
				},
			});
			await waitFor(() => expect(getByTestId("AuthenticationStep__encryption-password")).toHaveValue("password"));

			await waitFor(() => expect(getByTestId("StepNavigation__send-button")).not.toBeDisabled());

			userEvent.click(getByTestId("StepNavigation__send-button"));
			await findByTestId("TransactionSuccessful");

			expect(asFragment()).toMatchSnapshot();

			secondPublicKeyMock.mockRestore();
			signMock.mockRestore();
			broadcastMock.mockRestore();
			transactionMock.mockRestore();
			actsWithMnemonicMock.mockRestore();
			actsWithWifWithEncryptionMock.mockRestore();
			wifGetMock.mockRestore();
		});
	});
});
