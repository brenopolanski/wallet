/* eslint-disable @typescript-eslint/require-await */
import { Contracts } from "@payvo/sdk-profiles";
import React from "react";
import { env, fireEvent, getDefaultProfileId, MNEMONICS, render, screen, waitFor } from "utils/testing-library";

import { VerifyMessage } from "./VerifyMessage";

let wallet: Contracts.IReadWriteWallet;
let profile: Contracts.IProfile;
let signedMessage: any;
let signedMessageText: string;

describe("VerifyMessage", () => {
	beforeAll(async () => {
		profile = env.profiles().findById(getDefaultProfileId());
		wallet = profile.wallets().findById("ac38fe6d-4b67-4ef1-85be-17c5f6841129");

		signedMessageText = "Hello World";

		const signatory = await wallet.coin().signatory().mnemonic(MNEMONICS[0]);

		signedMessage = await wallet.message().sign({
			message: signedMessageText,
			signatory,
		});
	});

	const renderComponent = async ({
		isOpen = true,
		walletId = wallet.id(),
		profileId = profile.id(),
		...properties
	}: any) => {
		const utils = render(
			<VerifyMessage isOpen={isOpen} walletId={walletId} profileId={profileId} {...properties} />,
		);

		const submitButton = screen.getByTestId("VerifyMessage__submit");

		await waitFor(() => {
			expect(submitButton).toBeDisabled();
		});

		return utils;
	};

	it("should render", async () => {
		const { asFragment } = await renderComponent({});

		expect(asFragment()).toMatchSnapshot();
	});

	it("should switch between manual and json input", async () => {
		await renderComponent({});

		const toggle = screen.getByRole("checkbox");

		expect(screen.getByTestId("VerifyMessage__manual")).toBeInTheDocument();

		fireEvent.click(toggle);

		expect(screen.getByTestId("VerifyMessage__json")).toBeInTheDocument();

		fireEvent.click(toggle);

		expect(screen.getByTestId("VerifyMessage__manual")).toBeInTheDocument();
	});

	it("should open verify message modal and cancel", async () => {
		const onCancel = jest.fn();

		await renderComponent({ onCancel });

		const cancelButton = screen.getByTestId("VerifyMessage__cancel");

		fireEvent.click(cancelButton);

		expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: expect.any(MouseEvent) }));
	});

	it("should open verify message modal and close modal", async () => {
		const onClose = jest.fn();

		await renderComponent({ onClose });

		const closeButton = screen.getByTestId("modal__close-btn");

		fireEvent.click(closeButton);

		expect(onClose).toHaveBeenCalledWith();
	});

	it("should verify message", async () => {
		const onSubmit = jest.fn();

		await renderComponent({ onSubmit });

		const signatoryInput = screen.getByTestId("VerifyMessage__manual-signatory");
		const messageInput = screen.getByTestId("VerifyMessage__manual-message");
		const signatureInput = screen.getByTestId("VerifyMessage__manual-signature");

		fireEvent.input(signatoryInput, { target: { value: signedMessage.signatory } });
		fireEvent.input(messageInput, { target: { value: signedMessage.message } });
		fireEvent.input(signatureInput, { target: { value: signedMessage.signature } });

		const submitButton = screen.getByTestId("VerifyMessage__submit");

		await waitFor(() => {
			expect(submitButton).not.toBeDisabled();
		});

		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(true);
		});

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toHaveTextContent("success-banner-dark-green.svg");
		});
	});

	it("should verify message using json", async () => {
		const onSubmit = jest.fn();

		await renderComponent({ onSubmit });

		const toggle = screen.getByRole("checkbox");

		fireEvent.click(toggle);

		const jsonStringInput = screen.getByTestId("VerifyMessage__json-jsonString");

		fireEvent.input(jsonStringInput, { target: { value: JSON.stringify(signedMessage) } });

		expect(jsonStringInput).toHaveValue(JSON.stringify(signedMessage));

		const submitButton = screen.getByTestId("VerifyMessage__submit");

		await waitFor(() => {
			expect(submitButton).not.toBeDisabled();
		});

		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(true);
		});

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toHaveTextContent("success-banner-dark-green.svg");
		});
	});

	it("should fail to verify with invalid signature", async () => {
		const onSubmit = jest.fn();
		const onClose = jest.fn();

		await renderComponent({ onClose, onSubmit });

		const signatoryInput = screen.getByTestId("VerifyMessage__manual-signatory");
		const messageInput = screen.getByTestId("VerifyMessage__manual-message");
		const signatureInput = screen.getByTestId("VerifyMessage__manual-signature");

		fireEvent.input(signatoryInput, { target: { value: signedMessage.signatory } });
		fireEvent.input(messageInput, { target: { value: signedMessage.message } });
		fireEvent.input(signatureInput, { target: { value: "fake-signature" } });

		await waitFor(() => {
			expect(screen.getByTestId("VerifyMessage__submit")).not.toBeDisabled();
		});

		fireEvent.click(screen.getByTestId("VerifyMessage__submit"));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(false);
		});

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toHaveTextContent("error-banner-dark-green.svg");
		});

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		await waitFor(() => {
			expect(onClose).toHaveBeenCalledWith();
		});
	});

	it("should fail to verify using invalid data", async () => {
		const onSubmit = jest.fn();
		const onClose = jest.fn();

		await renderComponent({ onClose, onSubmit });

		const signatoryInput = screen.getByTestId("VerifyMessage__manual-signatory");
		const messageInput = screen.getByTestId("VerifyMessage__manual-message");
		const signatureInput = screen.getByTestId("VerifyMessage__manual-signature");

		const messageSpy = jest.spyOn(wallet.message(), "verify").mockRejectedValue(new Error());

		fireEvent.input(signatoryInput, { target: { value: signedMessage.signatory } });
		fireEvent.input(messageInput, { target: { value: signedMessage.message } });
		fireEvent.input(signatureInput, { target: { value: "fake-signature" } });

		const submitButton = screen.getByTestId("VerifyMessage__submit");

		await waitFor(() => {
			expect(submitButton).not.toBeDisabled();
		});

		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(false);
		});

		await waitFor(() => {
			expect(screen.getByTestId("modal__inner")).toHaveTextContent("error-banner-dark-green.svg");
		});

		fireEvent.click(screen.getByTestId("modal__close-btn"));

		await waitFor(() => {
			expect(onClose).toHaveBeenCalledWith();
		});

		messageSpy.mockRestore();
	});
});
